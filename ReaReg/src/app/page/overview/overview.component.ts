import {Component, OnInit, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';
import {HttpClient} from '@angular/common/http';
import {TranslateService} from '@ngx-translate/core';
import {MatSort} from '@angular/material/sort';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthService} from '../../service/auth.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import * as hf from '../../functions/functions';
import {MiddlewareURL} from '../../variables/variables';

/**
 * Protocol interface.
 */
export interface Protocol {
  id: number;
  datum: string;
  entldat: string;
  gebdat: string;
  geschl: string;
  patid: number;
  statimport: boolean;
  statmuss: number;
}

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})

/**
 * Overview page component. Shows overview.
 */
export class OverviewComponent implements OnInit {
  // Declare variables.
  displayedColumns: string[] = ['action', 'patid', 'datum', 'gebdat', 'geschl', 'entldat', 'evprotnr', 'statmuss', 'statimport'];
  data: any;
  dataOriginal: any;
  filterStatus = false;
  isLoadingResults = true;
  isRateLimitReached = false;
  // @ts-ignore
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  // @ts-ignore
  @ViewChild(MatSort) sort: MatSort;

  /**
   * Constructor.
   */
  constructor(private messageViewer: MatSnackBar, private route: ActivatedRoute, private router: Router, private authService: AuthService, public translate: TranslateService, private http: HttpClient) {
    // Get all protocols from server.
    this.http.get<any>(MiddlewareURL + '/overview', {headers: hf.getHeader()}).subscribe(data => {
        // Set accessToken.
        this.authService.setAccessToken(data);
        // Convert protocol information.
        for (const protocol of data.protocols) {
          // If patid is empty, the value is set to '-'.
          if (protocol.patid === '') {
            protocol.patid = '-';
          }
          // If datum is empty or '1000-01-01', the value is set to '-'.
          if (protocol.datum === '' || '1000-01-01' === protocol.datum) {
            protocol.datum = '-';
          }
          // If gebdat is empty or '1000-01-01', the value is set to '-'.
          if (protocol.gebdat === '' || '1000-01-01' === protocol.gebdat) {
            protocol.gebdat = '-';
          }
          // If geschl is '01', the value is set to 'm'.
          if (protocol.geschl === '01') {
            protocol.geschl = 'M';
            // If geschl is '02', the value is set to 'w'.
          } else if (protocol.geschl === '02') {
            protocol.geschl = 'W';
            // If geschl is '03', the value is set to 'd'.
          } else if (protocol.geschl === '03') {
            protocol.geschl = 'D';
            // If geschl is empty, the value is set to '-'.
          } else if ('' === protocol.geschl) {
            protocol.geschl = '-';
          }
          // If entldat is empty or '9999-99-99', the value is set to '-'.
          if ('' === protocol.entldat || '9999-99-99' === protocol.entldat) {
            protocol.entldat = '-';
          }
          // Set evprotnr.
          protocol.evprotnr = '';
          for (const evprotnr of [protocol.protnr_01, protocol.protnr_02, protocol.protnr_03, protocol.protnr_04, protocol.protnr_05]) {
            if (evprotnr !== '') {
              protocol.evprotnr += evprotnr + '\n ';
            }
          }
          if (protocol.evprotnr === '') {
            protocol.evprotnr = '-';
          }
          // If status mandatory fields is empty, the value is set to 0, else the value gets calculated.
          let count = 0;
          for (const field of ['statzckb', 'stateinsaort_cac', 'staturkrstst', 'statrosc', 'statekg1']) {
            if (protocol[field] === '1') {
              count++;
            }
          }
          protocol.statmuss = isNaN(parseInt(protocol.statmaxpflicht, 10)) ? 0 : Math.round(((parseInt(protocol.statistpflicht, 10) + count) / parseInt(protocol.statmaxpflicht, 10)) * 100);
          // Set importstatus.
          if (protocol.statimport) {
            protocol.statimport = this.translate.instant('overviewPage.yes');
            protocol.statimportB = true;
          } else {
            protocol.statimport = this.translate.instant('overviewPage.no');
            protocol.statimportB = false;
          }
        }
        // Add content to table, add paginator and sorting.
        this.data = new MatTableDataSource<Protocol>(data.protocols);
        this.data.paginator = this.paginator;
        this.data.sort = this.sort;
        // Save data to other variable.
        this.dataOriginal = this.data;
        // Hide loading spinner.
        this.isLoadingResults = false;
      },
      error => {
        // Handle errors of http get request.
        hf.handleErrors(error, this.authService, this.translate, this.messageViewer, this.router);
        this.isLoadingResults = false;
      });
  }

  /**
   * Translate paginator.
   * @returns void
   */
  ngOnInit(): void {
    hf.setPaginatorLanguage('paginator.protocol', this.translate, this.paginator);
  }

  /**
   * Update protocol on filter change.
   * @param val - all filter values.
   */
  updateFilter(val: any): void {
    // Getting date from calendar.
    this.data = (this.dataOriginal._data._value as any);
    // On click ch1 check if statmuss of each row is 100%.
    val.ch1 ? this.data = this.dataOriginal._data._value.filter((item: { statmuss: number; }) => {
      return item.statmuss && item.statmuss === 100;
    }) : this.data = this.dataOriginal._data._value.filter(() => {
      return true;
    });
    // On click ch2 check if statimport of each row is true.
    val.ch2 ? this.data = this.data.filter((item: { statimportB: boolean; }) => {
      return item.statimportB && item.statimportB;
    }) : this.data = this.data.filter(() => {
      return true;
    });
    // If value of dropdown is '1' (Einsatzdatum) check dateFrom and dateTo.
    if (val.dateName === '1') {
      this.data = this.data.filter((item: { datum: any; }) => {
        return hf.filterDate(item.datum, val);
      });
      // If value of dropdown is '2' (Entlassungsdatum) check dateFrom and dateTo.
    } else if (val.dateName === '2') {
      this.data = this.data.filter((item: { entldat: any; }) => {
        return hf.filterDate(item.entldat, val);
      });
    }
    // Filter on search field content.
    const keys = Object.keys(this.data[0] || '');
    // @ts-ignore
    this.data = this.data.filter(item => {
      // For each column check if search string is present.
      for (let i = 1; i < 8; i++) {
        // If string is date change format.
        if (item[keys[i]] && item[keys[i]].toString().match('([12]\\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01]))')) {
          const date = item[keys[i]].substring(8, 10) + '.' + item[keys[i]].substring(5, 7) + '.' + item[keys[i]].substring(0, 4);
          if ((date.toString().toLowerCase().indexOf(val.search.toString().toLowerCase().trim()) !== -1) || !val.search.toString().toLowerCase().trim()) {
            return true;
          }
        }
        if ((item[keys[i]] && item[keys[i]].toString().toLowerCase().indexOf(val.search.toString().toLowerCase().trim()) !== -1) || !val.search.toString().toLowerCase().trim()) {
          return true;
        }
      }
    });
    // Set content of table and add paginator and sorting.
    this.data = new MatTableDataSource<Protocol>(this.data);
    this.data.paginator = this.paginator;
    this.data.sort = this.sort;
  }
}
