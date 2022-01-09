import {Component, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, Validators} from '@angular/forms';
import {Papa, ParseResult} from 'ngx-papaparse';
import {SelectionModel} from '@angular/cdk/collections';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TranslateService} from '@ngx-translate/core';
import {MatPaginator} from '@angular/material/paginator';
import {HttpClient} from '@angular/common/http';
import {AuthService} from '../../service/auth.service';
import {Router} from '@angular/router';
import {MiddlewareURL} from '../../variables/variables';
import * as hf from '../../functions/functions';
import {MatStepper} from '@angular/material/stepper';

/**
 * Data interface.
 */
export interface Data {
  position: number;
  protnr: string;
  ekg1: string;
  urkrstst: string;
  einsaort_cac: string;
  zckb: string;
  rosc: string;
  autocpr: string;
  imported: string;
  id: string;
}

@Component({
  selector: 'app-import',
  templateUrl: './import.component.html',
  styleUrls: ['./import.component.scss']
})

/**
 * Import page component. Import SWISSRECA protocol.
 */
export class ImportComponent implements OnInit {
  // Declare variables.
  fileToUpload: any;
  importStatus = false;
  loading: any;
  authorization = 0;
  tableData: any[] = [];
  exportData: any[] = [];
  finalExportData: any[] = [];
  selected = localStorage.getItem('languageImport') as string;
  importForm: any;
  tableForm: any;
  header = true;
  selectionForExport: any[] = [];
  selection = new SelectionModel<Data>(true, []);
  displayedColumns: string[] = ['select', 'protnr', 'ekg1', 'urkrstst', 'einsaort_cac', 'zckb', 'rosc', 'autocpr', 'imported'];
  tableSource: any;

  // @ts-ignore
  @ViewChild(MatSort) sort: MatSort;
  // @ts-ignore
  @ViewChild('fileImportInput', {static: false}) fileImportInput: any;
  // @ts-ignore
  @ViewChild(MatPaginator) paginator: MatPaginator;

  /**
   * Constructor.
   */
  constructor(private fb: FormBuilder, private papa: Papa, private messageViewer: MatSnackBar, public translate: TranslateService, private http: HttpClient, private authService: AuthService, private router: Router) {
    // Set authorization from localStorage.
    this.authorization = authService.getUserAuthorization();
    // Check accessToken on server.
    this.http.get(MiddlewareURL + '/token', {headers: hf.getHeader()}).subscribe(data => {
        // Set accessToken.
        this.authService.setAccessToken(data);
      },
      error => {
        // Handle errors of http get request.
        hf.handleErrors(error, this.authService, this.translate, this.messageViewer, this.router);
      });
    // Create FormGroup importForm with FormControls and validators.
    this.importForm = fb.group({
      csvFile: ['', Validators.compose([Validators.required, Validators.minLength(3), Validators.pattern('.+(\\.csv)$')])],
      language: [this.selected, Validators.compose([Validators.required])],
      importStatus: [false, Validators.compose([Validators.requiredTrue])]
    });
    // Create FormGroup tableForm with FormControls and validators.
    this.tableForm = fb.group({
      table: [!this.selection.isEmpty(), Validators.compose([Validators.requiredTrue])]
    });
    // Add content to table.
    this.tableSource = new MatTableDataSource<Data>(this.tableData);
  }

  /**
   * Translate paginator.
   * @returns void
   */
  ngOnInit(): void {
    hf.setPaginatorLanguage('paginator.protocol', this.translate, this.paginator);
  }

  /**
   * Transfers the selection from MatchingTable to the export data.
   * @param stepper - MatStepper to go next on success
   * @returns void
   */
  transferSelection(stepper: MatStepper): void {
    const selection = this.selection.selected;
    this.selectionForExport = [];
    // Push all protnr in array.
    selection.forEach((entry) => {
      this.selectionForExport.push(entry.protnr);
    });
    this.finalExportData = [];
    // Prepare data to import.
    for (const exp of this.exportData) {
      if (this.selectionForExport.includes(exp.protnr)) {
        for (const table of this.tableData) {
          if (exp.protnr === table.protnr) {
            exp.id = table.id;
            exp.imported = '1';
            this.finalExportData.push(exp);
          }
        }
      }
    }
    // Import protocols.
    this.http.put<any>(MiddlewareURL + '/import/', {import: this.finalExportData}, {headers: hf.getHeader()}).subscribe(data => {
        // Set accessToken, notify user and go to next step.
        this.authService.setAccessToken(data);
        hf.successNotification(this.translate.instant('importPage.stepper.thirdStep.successSnackBar'), this.translate, this.messageViewer);
        this.importStatus = true;
        stepper.next();
      },
      error => {
        // Handle errors of http put request.
        hf.handleErrors(error, this.authService, this.translate, this.messageViewer, this.router);
      });
  }

  /**
   * Check if all elements in table are selected.
   * @returns boolean - Returns true if all checkboxes are checked otherwise false.
   */
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    let numRows = 0;
    this.tableSource.data.forEach((row: Data) => {
      if (row.imported !== this.translate.instant('message.doesNotExist')) {
        numRows++;
      }
    });
    return numSelected === numRows;
  }

  /**
   * Select all rows.
   * @returns void
   */
  masterToggle(): void {
    this.isAllSelected() ?
      this.selection.clear() :
      this.tableSource.data.forEach((row: Data) => {
        if (row.imported !== this.translate.instant('message.doesNotExist')) {
          this.selection.select(row);
        }
      });
  }

  /**
   * Set language of import and get data from server.
   * @param papaParseObj - Imported CSV Data as PapaParse Object
   * @param option - Which table is to be edited (matchTable, exportData)
   * @returns void
   */
  preparePapaParseObj(papaParseObj: ParseResult, option: string): void {
    this.selection = new SelectionModel<Data>(true, []);
    this.translate.use(localStorage.getItem('languageImport') as string).toPromise().then(() => {
      if (option === 'matchTable') {
        // Create tableData.
        this.tableData = (this.deleteExtraRows(this.matchTable(this.trim(papaParseObj)))).data;
        // Check if already imported.
        const protocols = [];
        for (const protnr of this.tableData) {
          protocols.push(protnr.protnr);
        }
        this.http.get<any>(MiddlewareURL + '/import/checkImport/' + encodeURIComponent(protocols.toString()), {headers: hf.getHeader()}).subscribe(data => {
            // set accessToken.
            this.authService.setAccessToken(data);
            for (const protocol of this.tableData) {
              protocol.imported = this.translate.instant('message.doesNotExist');
              for (const d of data.protocols) {
                if (d.protnr === protocol.protnr && d.statimport === '1') {
                  protocol.id = d.id;
                  protocol.imported = this.translate.instant('message.yes');
                } else if (d.protnr === protocol.protnr && (d.statimport === '0' || d.statimport === '')) {
                  protocol.id = d.id;
                  protocol.imported = this.translate.instant('message.no');
                }
              }
            }
          },
          error => {
            // Handle error of http get request.
            hf.handleErrors(error, this.authService, this.translate, this.messageViewer, this.router);
          });
        // Set DataSource for matching Table.
        this.tableSource = new MatTableDataSource<Data>(this.tableData);
        // Set paginator and sort.
        this.tableSource.paginator = this.paginator;
        this.tableSource.sort = this.sort;
        // Set loading to false for progress bar.
        this.loading = false;
      } else if (option === 'exportData') {
        // Create exportData.
        this.exportData = (this.deleteExtraRows(this.match(this.trim(papaParseObj)))).data;
        // Set loading to false for progress bar.
        this.loading = false;
      }
    });
  }

  /**
   * Input CSV from file.
   * @returns void
   */
  importCsv(): void {
    // Set loading to true for progress bar.
    this.loading = true;
    // CSV Parser for matching.
    this.papa.parse(this.fileToUpload, {
      complete: (result) => {
        this.preparePapaParseObj(result, 'matchTable');
      },
      // Data has header set true.
      header: true
    });
    // CSV Parser for export data.
    this.papa.parse(this.fileToUpload, {
      complete: (result) => {
        this.preparePapaParseObj(result, 'exportData');
      },
      // Data has header set true.
      header: true
    });
    // Set value of importStatus to true.
    this.importForm.controls.importStatus.setValue(true);
  }

  /**
   * Input change listener for the csv file.
   * @returns void
   * @param $event - Event
   */
  fileChangeListener($event: any): void {
    // Select files from $event
    this.fileToUpload = $event.target.files[0];
  }

  /**
   * Deletes all  all protocols with extra rows at the end.
   * @returns papaParseObj - Returns the transformed PapaParse Object
   * @param papaParseObj - Imported CSV Data as PapaParse Object
   */
  deleteExtraRows(papaParseObj: ParseResult): ParseResult {
    for (let i = 0; i < papaParseObj.data.length; i++) {
      if (papaParseObj.data[i].protnr === undefined || papaParseObj.data[i].protnr === '') {
        papaParseObj.data.splice(i, 1);
      }
    }
    return papaParseObj;
  }

  /**
   * Deletes all fields that are not relevant for import.
   * @returns papaParseObj - Returns the transformed PapaParse Object
   * @param papaParseObj - Imported CSV Data as PapaParse Object
   */
  trim(papaParseObj: ParseResult): ParseResult {
    for (const data of papaParseObj.data) {
      Object.entries(data).forEach(([key]) => {
        switch (key) {
          case this.translate.instant('evProtocol.emergencyService.title'):
            data.protnr = data[key];
            delete data[key];
            break;
          case this.translate.instant('evProtocol.ekg1.title'):
            data.ekg1 = data[key];
            delete data[key];
            break;
          case this.translate.instant('evProtocol.urkrstst.title'):
            data.urkrstst = data[key];
            delete data[key];
            break;
          case this.translate.instant('evProtocol.einsaort_cac.title'):
            data.einsaort_cac = data[key];
            delete data[key];
            break;
          case this.translate.instant('evProtocol.zckb.title'):
            data.zckb = data[key];
            delete data[key];
            break;
          case this.translate.instant('evProtocol.rosc.title'):
            data.rosc = data[key];
            delete data[key];
            break;
          case this.translate.instant('evProtocol.autocpr.title'):
            data.autocpr = data[key];
            delete data[key];
            break;
          default:
            delete data[key];
        }
      });
    }
    return papaParseObj;
  }

  /**
   * Match data between dataset SWISSRECA and WV-CAC 1.0.
   * @returns papaParseObj - Returns the transformed PapaParse Object
   * @param papaParseObj - Imported CSV Data as PapaParse Object
   */
  match(papaParseObj: ParseResult): ParseResult {
    for (const data of papaParseObj.data) {
      Object.entries(data).forEach(([key]) => {
        switch (key) {
          case 'ekg1':
            switch (data[key]) {
              case this.translate.instant('evProtocol.ekg1.option.1802'):
                delete data[key];
                break;
              case this.translate.instant('evProtocol.ekg1.option.1803'):
                delete data[key];
                break;
              case this.translate.instant('evProtocol.ekg1.option.1805'):
                data[key] = '11';
                break;
              case this.translate.instant('evProtocol.ekg1.option.1806'):
                delete data[key];
                break;
              case this.translate.instant('evProtocol.ekg1.option.1800'):
                data[key] = '09';
                break;
              case this.translate.instant('evProtocol.ekg1.option.1801'):
                delete data[key];
                break;
              case this.translate.instant('evProtocol.ekg1.option.1804'):
                data[key] = '10';
                break;
              case this.translate.instant('evProtocol.ekg1.option.1807'):
                data[key] = '01';
                break;
              case this.translate.instant('evProtocol.ekg1.option.1808'):
                data[key] = '99';
                break;
              default:
                delete data[key];
            }
            break;
          case 'urkrstst':
            switch (data[key]) {
              case this.translate.instant('evProtocol.urkrstst.option.1575'):
                delete data[key];
                break;
              case this.translate.instant('evProtocol.urkrstst.option.1576'):
                data[key] = '02';
                break;
              case this.translate.instant('evProtocol.urkrstst.option.1577'):
                data[key] = '05';
                break;
              case this.translate.instant('evProtocol.urkrstst.option.1578'):
                data[key] = '03';
                break;
              case this.translate.instant('evProtocol.urkrstst.option.1579'):
                delete data[key];
                break;
              case this.translate.instant('evProtocol.urkrstst.option.1580'):
                data[key] = '04';
                break;
              default:
                delete data[key];
            }
            break;
          case 'einsaort_cac':
            switch (data[key]) {
              case this.translate.instant('evProtocol.einsaort_cac.option.1565'):
                data[key] = '01';
                break;
              case this.translate.instant('evProtocol.einsaort_cac.option.1566'):
                data[key] = '02';
                break;
              case this.translate.instant('evProtocol.einsaort_cac.option.1567'):
                data[key] = '03';
                break;
              case this.translate.instant('evProtocol.einsaort_cac.option.1568'):
                data[key] = '11';
                break;
              case this.translate.instant('evProtocol.einsaort_cac.option.1569'):
                data[key] = '06';
                break;
              case this.translate.instant('evProtocol.einsaort_cac.option.1570'):
                data[key] = '06';
                break;
              case this.translate.instant('evProtocol.einsaort_cac.option.1571'):
                data[key] = '10';
                break;
              case this.translate.instant('evProtocol.einsaort_cac.option.2079'):
                data[key] = '04';
                break;
              case this.translate.instant('evProtocol.einsaort_cac.option.2741'):
                delete data[key];
                break;
              case this.translate.instant('evProtocol.einsaort_cac.option.1572'):
                data[key] = '09';
                break;
              case this.translate.instant('evProtocol.einsaort_cac.option.1573'):
                data[key] = '00';
                break;
              default:
                delete data[key];
            }
            break;
          case 'zckb':
            switch (data[key]) {
              case this.translate.instant('evProtocol.zckb.option.2066'):
                data[key] = '05';
                break;
              case this.translate.instant('evProtocol.zckb.option.2067'):
                data[key] = '01';
                break;
              case this.translate.instant('evProtocol.zckb.option.2068'):
                data[key] = '02';
                break;
              case this.translate.instant('evProtocol.zckb.option.2069'):
                data[key] = '04';
                break;
              case this.translate.instant('evProtocol.zckb.option.2070'):
                data[key] = '98';
                break;
              default:
                delete data[key];
            }
            break;
          case 'rosc':
            switch (data[key]) {
              case this.translate.instant('evProtocol.rosc.option.1613'):
                data[key] = '02';
                break;
              case this.translate.instant('evProtocol.rosc.option.1614'):
                data[key] = '01';
                break;
              case this.translate.instant('evProtocol.rosc.option.1615'):
                delete data[key];
                break;
              default:
                delete data[key];
            }
            break;
          case 'autocpr':
            switch (data[key]) {
              case this.translate.instant('evProtocol.autocpr.option.1863'):
                data[key] = '06';
                break;
              case this.translate.instant('evProtocol.autocpr.option.1864'):
                data[key] = '05';
                break;
              case this.translate.instant('evProtocol.autocpr.option.1865'):
                delete data[key];
                break;
              default:
                delete data[key];
            }
            break;
        }
      });
    }
    return papaParseObj;
  }

  /**
   * Creates the graphical mapping for the table in step two.
   * @returns papaParseObj - Returns the transformed PapaParse Object
   * @param papaParseObj - Imported CSV Data as PapaParse Object
   */
  matchTable(papaParseObj: ParseResult): ParseResult {
    for (const data of papaParseObj.data) {
      Object.entries(data).forEach(([key]) => {
        switch (key) {
          case 'ekg1':
            switch (data[key]) {
              case this.translate.instant('evProtocol.ekg1.option.1802'):
                data[key] += ' --> ' + this.translate.instant('evProtocol.noMatch');
                break;
              case this.translate.instant('evProtocol.ekg1.option.1803'):
                data[key] += ' --> ' + this.translate.instant('evProtocol.noMatch');
                break;
              case this.translate.instant('evProtocol.ekg1.option.1807'):
                data[key] += ' --> ' + this.translate.instant('wvProtocol.ekg1.option.01');
                break;
              case this.translate.instant('evProtocol.ekg1.option.1800'):
                data[key] += ' --> ' + this.translate.instant('wvProtocol.ekg1.option.09');
                break;
              case this.translate.instant('evProtocol.ekg1.option.1801'):
                data[key] += ' --> ' + this.translate.instant('evProtocol.noMatch');
                break;
              case this.translate.instant('evProtocol.ekg1.option.1804'):
                data[key] += ' --> ' + this.translate.instant('wvProtocol.ekg1.option.10');
                break;
              case this.translate.instant('evProtocol.ekg1.option.1805'):
                data[key] += ' --> ' + this.translate.instant('wvProtocol.ekg1.option.11');
                break;
              case this.translate.instant('evProtocol.ekg1.option.1808'):
                data[key] += ' --> ' + this.translate.instant('wvProtocol.ekg1.option.99');
                break;
              case this.translate.instant('evProtocol.ekg1.option.1806'):
                data[key] += ' --> ' + this.translate.instant('evProtocol.noMatch');
                break;
              default:
            }
            break;
          case 'urkrstst':
            switch (data[key]) {
              case this.translate.instant('evProtocol.urkrstst.option.1575'):
                data[key] += ' --> ' + this.translate.instant('evProtocol.noMatch');
                break;
              case this.translate.instant('evProtocol.urkrstst.option.1576'):
                data[key] += ' --> ' + this.translate.instant('wvProtocol.urkrstst.option.02');
                break;
              case this.translate.instant('evProtocol.urkrstst.option.1577'):
                data[key] += ' --> ' + this.translate.instant('wvProtocol.urkrstst.option.05');
                break;
              case this.translate.instant('evProtocol.urkrstst.option.1578'):
                data[key] += ' --> ' + this.translate.instant('wvProtocol.urkrstst.option.03');
                break;
              case this.translate.instant('evProtocol.urkrstst.option.1579'):
                data[key] += ' --> ' + this.translate.instant('evProtocol.noMatch');
                break;
              case this.translate.instant('evProtocol.urkrstst.option.1580'):
                data[key] += ' --> ' + this.translate.instant('wvProtocol.urkrstst.option.04');
                break;
              default:
            }
            break;
          case 'einsaort_cac':
            switch (data[key]) {
              case this.translate.instant('evProtocol.einsaort_cac.option.1565'):
                data[key] += ' --> ' + this.translate.instant('wvProtocol.einsaort_cac.option.01');
                break;
              case this.translate.instant('evProtocol.einsaort_cac.option.1566'):
                data[key] += ' --> ' + this.translate.instant('wvProtocol.einsaort_cac.option.02');
                break;
              case this.translate.instant('evProtocol.einsaort_cac.option.1567'):
                data[key] += ' --> ' + this.translate.instant('wvProtocol.einsaort_cac.option.03');
                break;
              case this.translate.instant('evProtocol.einsaort_cac.option.1568'):
                data[key] += ' --> ' + this.translate.instant('wvProtocol.einsaort_cac.option.11');
                break;
              case this.translate.instant('evProtocol.einsaort_cac.option.1569'):
                data[key] += ' --> ' + this.translate.instant('wvProtocol.einsaort_cac.option.06');
                break;
              case this.translate.instant('evProtocol.einsaort_cac.option.1570'):
                data[key] += ' --> ' + this.translate.instant('wvProtocol.einsaort_cac.option.06');
                break;
              case this.translate.instant('evProtocol.einsaort_cac.option.1571'):
                data[key] += ' --> ' + this.translate.instant('wvProtocol.einsaort_cac.option.10');
                break;
              case this.translate.instant('evProtocol.einsaort_cac.option.2079'):
                data[key] += ' --> ' + this.translate.instant('wvProtocol.einsaort_cac.option.04');
                break;
              case this.translate.instant('evProtocol.einsaort_cac.option.2741'):
                data[key] += ' --> ' + this.translate.instant('evProtocol.noMatch');
                break;
              case this.translate.instant('evProtocol.einsaort_cac.option.1572'):
                data[key] += ' --> ' + this.translate.instant('wvProtocol.einsaort_cac.option.09');
                break;
              case this.translate.instant('evProtocol.einsaort_cac.option.1573'):
                data[key] += ' --> ' + this.translate.instant('wvProtocol.einsaort_cac.option.00');
                break;
              default:
            }
            break;
          case 'zckb':
            switch (data[key]) {
              case this.translate.instant('evProtocol.zckb.option.2066'):
                data[key] += ' --> ' + this.translate.instant('wvProtocol.zckb.option.05');
                break;
              case this.translate.instant('evProtocol.zckb.option.2067'):
                data[key] += ' --> ' + this.translate.instant('wvProtocol.zckb.option.01');
                break;
              case this.translate.instant('evProtocol.zckb.option.2068'):
                data[key] += ' --> ' + this.translate.instant('wvProtocol.zckb.option.02');
                break;
              case this.translate.instant('evProtocol.zckb.option.2069'):
                data[key] += ' --> ' + this.translate.instant('wvProtocol.zckb.option.04');
                break;
              case this.translate.instant('evProtocol.zckb.option.2070'):
                data[key] += ' --> ' + this.translate.instant('wvProtocol.zckb.option.98');
                break;
              default:
            }
            break;
          case 'rosc':
            switch (data[key]) {
              case this.translate.instant('evProtocol.rosc.option.1613'):
                data[key] += ' --> ' + this.translate.instant('wvProtocol.rosc.option.02');
                break;
              case this.translate.instant('evProtocol.rosc.option.1614'):
                data[key] += ' --> ' + this.translate.instant('wvProtocol.rosc.option.01');
                break;
              case this.translate.instant('evProtocol.rosc.option.1615'):
                data[key] += ' --> ' + this.translate.instant('evProtocol.noMatch');
                break;
              default:
            }
            break;
          case 'autocpr':
            switch (data[key]) {
              case this.translate.instant('evProtocol.autocpr.option.1863'):
                data[key] += ' --> ' + this.translate.instant('wvProtocol.autocpr.option.06');
                break;
              case this.translate.instant('evProtocol.autocpr.option.1864'):
                data[key] += ' --> ' + this.translate.instant('wvProtocol.autocpr.option.05');
                break;
              case this.translate.instant('evProtocol.autocpr.option.1865'):
                data[key] += ' --> ' + this.translate.instant('evProtocol.noMatch');
                break;
              default:
            }
            break;
        }
      });
    }
    return papaParseObj;
  }

  /**
   * Set languageImport to selection.
   * @returns void
   */
  onChange(): void {
    localStorage.setItem('languageImport', this.selected);
  }

  /**
   * Redirect to overview.
   * @returns void
   */
  goToOverview(): void {
    this.router.navigate(['/overview']);
  }

  /**
   * Get css class.
   * @param imported - Status of import row
   * @param val - Value of table cell
   * @returns string - Returns the correct css class according to the field content
   */
  getStyleClass(imported: string, val: string = '-->'): string {
    if (imported === this.translate.instant('message.doesNotExist')) {
      return 'itemDisabled';
    } else if (imported === this.translate.instant('message.yes') && val === '-->') {
      return 'itemBlue';
    } else if (imported === this.translate.instant('message.no') && val === '-->') {
      return '';
    } else if (val !== undefined && !val.includes('-->')) {
      return 'itemRed';
    } else if (val !== undefined && val.includes(this.translate.instant('evProtocol.noMatch'))) {
      return 'itemOrange';
    } else {
      return '';
    }
  }

  /**
   * Set imput table to true if it is not empty otherwise false.
   * @returns void
   */
  updateForm(): void {
    this.tableForm.controls.table.setValue(!this.selection.isEmpty());
  }

  /**
   * Prevent checkbox from checking.
   * @param $event - Event
   * @param imported - Status of import row
   * @returns void
   */
  preventClick($event: MouseEvent, imported: string): void {
    if (imported === this.translate.instant('message.doesNotExist')) {
      $event.stopPropagation();
    }
  }
}
