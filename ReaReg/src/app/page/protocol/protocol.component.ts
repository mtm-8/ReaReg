import {AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener} from '@angular/core';
import {AuthService} from '../../service/auth.service';
import {AbstractControl, FormArray, FormBuilder, ValidationErrors, ValidatorFn, Validators} from '@angular/forms';
import * as moment from 'moment';
import {Moment} from 'moment';
import {DialogComponent} from '../../component/dialog/dialog.component';
import {MatDialog} from '@angular/material/dialog';
import {ActivatedRoute, Router} from '@angular/router';
import {MiddlewareURL} from '../../variables/variables';
import * as hf from '../../functions/functions';
import {HttpClient} from '@angular/common/http';
import {TranslateService} from '@ngx-translate/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {CustomErrorStateMatcher} from '../../interface/custom-error-state-matcher';
import {DateAdapter, ErrorStateMatcher, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from '@angular/material/core';
import {MAT_MOMENT_DATE_ADAPTER_OPTIONS, MAT_MOMENT_DATE_FORMATS, MomentDateAdapter} from '@angular/material-moment-adapter';
import {DialogConfirmComponent} from '../../component/dialog-confirm/dialog-confirm.component';
import {DialogPatIdComponent} from '../../component/dialog-pat-id/dialog-pat-id.component';
import {CustomValidators} from '../../interface/custom-validators';
import {NgxMaterialTimepickerComponent} from 'ngx-material-timepicker';

@Component({
  selector: 'app-protocol',
  templateUrl: './protocol.component.html',
  styleUrls: ['./protocol.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{provide: ErrorStateMatcher, useClass: CustomErrorStateMatcher}, {provide: MAT_DATE_LOCALE, useValue: 'de-CH'}, {provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]}, {provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS}],
})


/**
 * Protocol page component. Create, edit and delete protocols.
 */
export class ProtocolComponent implements AfterViewInit {
  // Declare variables.
  isLoaded = false;
  protocolId: any;
  amountRequired = 0;
  amount = 0;
  units: any;
  ekgaufenCheck = true;
  instabCheck = true;
  komplsekCheck = true;
  wvProtocol: any;
  evprotnrs: any;
  numberReg = '^[0-9-]';
  floatReg = '^[0-9.-]';
  autoSaveStatus = 'check';
  loaded = false;
  targetClinicList: any[] = [{name: 'nicht bekannt', uid: '99999999'}, {name: 'Inselgruppe AG', uid: '229707417'}, {name: 'Universitätsspital Basel', uid: '115173213'}, {name: 'Centre hospitalier universitaire vaudois (CHUV)', uid: '112049568'}, {name: 'Hôpitaux universitaires de Genève (HUG)', uid: '108907884'}, {name: 'Universitätsspital Zürich', uid: '108904325'}, {name: 'Bethesda Spital AG', uid: '115313773'}, {name: 'Solifonds Spital', uid: '450245801'}, {name: 'Spital STS AG', uid: '109382518'}, {name: 'Salem - Spital AG', uid: '109547794'}, {name: 'Spital Affoltern AG', uid: '108913979'}, {name: 'Spital Limmattal', uid: '108922872'}];

  /**
   * Constructor.
     */
  constructor(public timePicker: NgxMaterialTimepickerComponent, private cRef: ChangeDetectorRef, private adapter: DateAdapter<any>, public authService: AuthService, private fb: FormBuilder, public dialog: MatDialog, public router: Router, public route: ActivatedRoute, private http: HttpClient, public translate: TranslateService, private messageViewer: MatSnackBar) {
    // Set locale for moment library.
    moment.locale('de-CH');
    // Get ID of protocol.
    this.protocolId = this.route.snapshot.paramMap.get('p');
    // Create FormGroup wvProtocol with nested FormGroups, FormArrays, FormControls and validators.
    this.wvProtocol = this.fb.group({
      section1: this.fb.group({protnrArray: this.fb.array([this.fb.group({protnr: [null]})]), datum: [''], adatum: [''], adatumR: [''], zadatum: [''], stokenn: [''], namklin: [''], iknumklin: [''], patid: [''], gebdat: [''], gebdatR: [''], geschl: [''], aufnq: [''], zkuebgp: ['']}),
      section2: this.fb.group({ekg1: [''], urkrstst: [''], einsaort_cac: [''], eoko: [''], eokc: [''], zckb: [''], zkoll: [''], zchdm: [''], zhdm: [''], rosc: [''], zrosc1: [''], adrena: [''], adrenaR: [''], amioda: [''], amiodaR: [''], pes: [''], autocpr: ['']}),
      section3: this.fb.group({bewaufn: [''], rosca: [''], ekgaufn: [0], ekgaufn1: [false], ekgaufn2: [false], ekgaufn3: [false], ekgaufn4: [false], ekgaufn5: [false], ekgaufn6: [false], ekgaufn7: [false], ekgaufn8: [false], ekgaufn9: [false], ekgaufn10: [false], ekgaufn11: [false], ekgaufn12: [false], ekgaufn13: [false], ekgaufn14: [false], rraufn: [''], rraufnR: [''], rrdaufn: [''], rrdaufnR: [''], hfaufn: [''], hfaufnR: [''], afaufn: [''], afaufnR: [''], beataufn: [''], o2saufn: [''], o2saufnR: [''], co2aufn: [''], co2aufnR: [''], tempaufn: [''], tempaufnR: [''], bgaaufn: [''], hbaufn: [''], hbaufnR: [''], phaufn: [''], phaufnR: [''], beaufn: [''], beaufnR: [''], pco2aufn: [''], pco2aufnR: [''], lactaufn: [''], lactaufnR: [''], bzaufn: [''], bzaufnR: [''], kreaaufn: [''], kreaaufnR: [''], tropart: [''], troponw: [''], tropaaufn: [''], tropaufn: [''], trop2aaufn: [''], trop2aufn: [''], bnpaufn: [''], urkrststaufn: [''], zroscaufn: [''], zroscaufnR: ['']}),
      section3hyb: this.fb.group({reaverl: [0], reaverl1: [false], reaverl2: [false], reaverl3: [false], reaverl4: [false], reaverl5: [false], reaverl6: [false], reaverl7: [false], reaverl8: [false]}),
      section4: this.fb.group({ekg12: [''], dekg12: [''], zekg12: [''], ekg12auf: [''], stemi: [''], efast: [''], ct: [''], dct: [''], zct: [''], coro: [''], dcoro: [''], zcoro: [''], coro_cpr: [''], ncoro_grund: [''], ecls: [''], decls: [''], zecls: [''], geniabp: [''], diabp: [''], ziabp: [''], genimpella: [''], dimpella: [''], zimpella: [''], acb: [''], genpacerwv: [''], epu: [''], hits: [0], hits1: [false], hits2: [false], hits3: [false], hits4: [false], hits5: [false], hits6: [false], hits7: [false], hits8: [false], hits9: [false], bzziel2: [''], rrziel3: [''], rrziel3R: ['']}),
      section4ICU: this.fb.group({instab: [0], instab1: [false], instab2: [false], instab3: [false], instab4: [false], instab5: [false], instab6: [false]}),
      section4hyb: this.fb.group({tee: [''], tte: [''], pci: [''], pcierfolg: [''], pcigefae: [0], pcigefae1: [false], pcigefae2: [false], pcigefae3: [false], pcigefae4: [false], pcigefae5: [false], pcigefae6: [false], lyse: [''], lyse_rosc: [0], lyse_rosc1: [false], lyse_rosc2: [false], lyse_rosc3: [false], dlyse: [''], zlyse: ['']}),
      section5: this.fb.group({ecprdbk: [''], ecprzbk: [''], ecprdst: [''], ecprzst: [''], ecprlact: [''], ecprph: [''], ecprbe: [''], ecprpco2: [''], ecprpao2: [''], ecprpunkt: [''], ecprart: [''], ecprven: [0], ecprven1: [false], ecprven2: [false], ecprven3: [false], ecprven4: [false], ecprven5: [false], ecprbein: [''], ecprvav: [''], roscecpr: [''], ecprende: [''], ecprkompl: [0], ecprkompl1: [false], ecprkompl2: [false], ecprkompl3: [false], ecprkompl4: [false], ecprkompl5: [false], ecprkompl6: [false], ecprdend: [''], ecprzend: [''], eclsiabp: [''], impellaecls: ['']}),
      section6: this.fb.group({aktkuehl: [''], naktkuehl_grund: [''], kuehlbeg: [''], dkuehlbeg: [''], dkuehlbegR: [''], zkuehlbeg: [''], zkuehlbegR: [''], dauerkuehl: [''], zieltemp1: [''], dzieltemp: [''], zzieltemp: [''], kuehlrel: [''], fieb: [''], fiebrpae: ['']}), section7: this.fb.group({ssep: [''], nse: [''], eegwv: [''], cct: [''], cmrt: [''], neuro: ['']}),
      section8: this.fb.group({leb30d: [''], komplsek: [0], komplsek1: [false], komplsek2: [false], komplsek3: [false], komplsek4: [false], komplsek5: [false], komplsek6: [false], komplsek7: [false], komplsek8: [false], komplsek9: [false], icutage: [''], icutageR: [''], beatstd: [''], beatstdR: [''], icdimpl: [''], lebentl: [''], thlimit: [''], gthlimit: [0], gthlimit1: [false], gthlimit2: [false], gthlimit3: [false], gthlimit4: [false], gthlimit5: [false], organexpl: [''], entldat: [''], entldatR: [''], wvwie: [''], vdatum: [''], zvdatum: [''], wvgrund: [0], wvgrund1: [false], wvgrund2: [false], wvgrund3: [false], wvgrund4: [false], wvgrund5: [false], wvgrund6: [false], wvgrund7: [false], wvgrund8: [false], cpcentl: [''], mrsentl: [''], cpcvor: [''], mrsvor: [''], lebensqual1: [''], eq5d: [''], sf12: ['']}),
      section8hyb: this.fb.group({leb24h: [''], dtod: [''], dtodR: [''], ztod: [''], ztodR: ['']}),
    });
    // Get measuring units.
    this.http.get<any>(MiddlewareURL + '/measuringUnit', {headers: hf.getHeader()}).subscribe(data => {
      // Set units with measuring unit data from database.
      this.units = data.units;
      // Set accessToken.
      this.authService.setAccessToken(data);
      // Set validators after measuring units have been loaded.
      // Set validators of section 1 from WV-CAC 1.0.
      for (const field of ['datum', 'gebdat']) {
        this.getFormControl('section1', field).setValidators([Validators.required, this.dateSmallerOrEqualToToday()]);
      }
      for (const field of ['geschl', 'aufnq', 'stokenn']) {
        this.getFormControl('section1', field).setValidators([Validators.required]);
      }
      this.getFormControl('section1', 'adatum').setValidators([Validators.required, this.dateSmallerOrEqualToToday(), this.dateGreaterThanValidator('section1', 'datum')]);
      this.getFormControl('section1', 'iknumklin').disable();
      this.getFormControl('section1', 'patid').setValidators([Validators.required, Validators.pattern('^[0-9]{1,10}$')]);
      // Set validators of section 2 from WV-CAC 1.0.
      for (const field of ['ekg1', 'urkrstst', 'zckb', 'zchdm', 'rosc']) {
        this.getFormControl('section2', field).setValidators([Validators.required]);
      }
      this.getFormControl('section2', 'adrena').setValidators([Validators.min(0.01), Validators.max(99.8)]);
      this.getFormControl('section2', 'amioda').setValidators([Validators.min(1), Validators.max(998)]);
      // Set validators of section 3 from WV-CAC 1.0 depending on measuring units.
      for (const field of ['rosca', 'urkrststaufn', 'bgaaufn']) {
        this.getFormControl('section3', field).setValidators([Validators.required]);
      }
      this.getFormControl('section3', 'ekgaufn').setValidators([Validators.min(1), Validators.max(3)]);
      this.getFormControl('section3', 'ekgaufn').updateValueAndValidity();
      this.getFormControl('section3', 'o2saufn').setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
      if (this.getMeasUnitForField('co2aufn') === 'mmHg') {
        this.getFormControl('section3', 'co2aufn').setValidators([Validators.min(0), Validators.max(80)]);
      } else if (this.getMeasUnitForField('co2aufn') === 'kPa') {
        this.getFormControl('section3', 'co2aufn').setValidators([Validators.min(0), Validators.max(10.666)]);
      }
      this.getFormControl('section3', 'tempaufn').setValidators([Validators.min(20.0), Validators.max(40.0)]);
      if (this.getMeasUnitForField('lactaufn') === 'mg/dl') {
        this.getFormControl('section3', 'lactaufn').setValidators([Validators.required, Validators.min(0.90), Validators.max(270.03)]);
      } else if (this.getMeasUnitForField('lactaufn') === 'mmol/l') {
        this.getFormControl('section3', 'lactaufn').setValidators([Validators.required, Validators.min(0.10), Validators.max(29.97)]);
      }
      if (this.getMeasUnitForField('bzaufn') === 'mg/dl') {
        this.getFormControl('section3', 'bzaufn').setValidators([Validators.required, Validators.min(0), Validators.max(600)]);
      } else if (this.getMeasUnitForField('bzaufn') === 'mmol/l') {
        this.getFormControl('section3', 'bzaufn').setValidators([Validators.required, Validators.min(0), Validators.max(33.3)]);
      }
      if (this.getMeasUnitForField('kreaaufn') === 'mg/dl') {
        this.getFormControl('section3', 'kreaaufn').setValidators([Validators.required, Validators.min(0.200), Validators.max(5.700)]);
      } else if (this.getMeasUnitForField('kreaaufn') === 'μmol/l') {
        this.getFormControl('section3', 'kreaaufn').setValidators([Validators.required, Validators.min(17.7), Validators.max(503.9)]);
      }
      this.getFormControl('section3', 'troponw').setValidators([Validators.min(0.0001), Validators.max(0.4)]);
      this.getFormControl('section3', 'tropaaufn').setValidators([Validators.min(0.01), Validators.max(9999999.99)]);
      this.getFormControl('section3', 'tropaufn').setValidators([Validators.min(0), Validators.max(500)]);
      this.getFormControl('section3', 'trop2aaufn').setValidators([Validators.min(0.01), Validators.max(9999999.99)]);
      this.getFormControl('section3', 'trop2aufn').setValidators([Validators.min(0), Validators.max(500)]);
      this.getFormControl('section3', 'bnpaufn').setValidators([Validators.min(0), Validators.max(99998)]);
      // Set validators of section 4 from WV-CAC 1.0.
      for (const field of ['ekg12', 'efast', 'ct', 'coro']) {
        this.getFormControl('section4', field).setValidators([Validators.required]);
      }
      this.getFormControl('section4', 'rrziel3').setValidators([Validators.min(30), Validators.max(120)]);
      this.getFormControl('section4', 'dekg12').setValidators([this.dateSmallerOrEqualToToday(), this.dateGreaterThanValidator('section1', 'adatum')]);
      this.getFormControl('section4', 'zekg12').setValidators([this.timeGreaterThanValidator('section1', 'adatum', 'zadatum', 'section4', 'dekg12')]);
      this.getFormControl('section4', 'dct').setValidators([this.dateSmallerOrEqualToToday(), this.dateGreaterThanValidator('section1', 'adatum')]);
      this.getFormControl('section4', 'zct').setValidators([this.timeGreaterThanValidator('section1', 'adatum', 'zadatum', 'section4', 'dct')]);
      this.getFormControl('section4', 'dcoro').setValidators([this.dateSmallerOrEqualToToday(), this.dateGreaterThanValidator('section1', 'adatum')]);
      this.getFormControl('section4', 'zcoro').setValidators([this.timeGreaterThanValidator('section1', 'adatum', 'zadatum', 'section4', 'dcoro')]);
      this.getFormControl('section4', 'decls').setValidators([this.dateSmallerOrEqualToToday(), this.dateGreaterThanValidator('section1', 'adatum')]);
      this.getFormControl('section4', 'zecls').setValidators([this.timeGreaterThanValidator('section1', 'adatum', 'zadatum', 'section4', 'decls')]);
      this.getFormControl('section4', 'diabp').setValidators([this.dateSmallerOrEqualToToday(), this.dateGreaterThanValidator('section1', 'adatum')]);
      this.getFormControl('section4', 'ziabp').setValidators([this.timeGreaterThanValidator('section1', 'adatum', 'zadatum', 'section4', 'diabp')]);
      this.getFormControl('section4', 'dimpella').setValidators([this.dateSmallerOrEqualToToday(), this.dateGreaterThanValidator('section1', 'adatum')]);
      this.getFormControl('section4', 'zimpella').setValidators([this.timeGreaterThanValidator('section1', 'adatum', 'zadatum', 'section4', 'dimpella')]);
      // Set validators of section 4hyb from WV-CAC 1.0.
      for (const field of ['tee', 'tte', 'lyse']) {
        this.getFormControl('section4hyb', field).setValidators([Validators.required]);
      }
      this.getFormControl('section4hyb', 'dlyse').setValidators([this.dateSmallerOrEqualToToday(), this.dateGreaterThanValidator('section1', 'adatum')]);
      this.getFormControl('section4hyb', 'zlyse').setValidators([this.timeGreaterThanValidator('section1', 'adatum', 'zadatum', 'section4hyb', 'dlyse')]);
      // Set Validators of section 4ICU from WV-CAC 1.0.
      this.getFormControl('section4ICU', 'instab').setValidators([Validators.min(1), Validators.max(4)]);
      this.getFormControl('section4ICU', 'instab').updateValueAndValidity();
      // Set validators of section 6 from WV-CAC 1.0.
      for (const field of ['aktkuehl']) {
        this.getFormControl('section6', field).setValidators([Validators.required]);
      }
      // Set validators of section 8 from WV-CAC 1.0.
      for (const field of ['leb30d', 'lebentl', 'thlimit', 'wvwie']) {
        this.getFormControl('section8', field).setValidators([Validators.required]);
      }
      this.getFormControl('section8', 'komplsek').setValidators([Validators.required, Validators.min(1), Validators.max(7)]);
      this.getFormControl('section8', 'komplsek').updateValueAndValidity();
      this.getFormControl('section8', 'entldat').setValidators([Validators.required, this.dateSmallerOrEqualToToday, this.dateGreaterThanValidator('section1', 'adatum')]);
      this.getFormControl('section8', 'icutage').setValidators([Validators.min(0), Validators.max(997)]);
      this.getFormControl('section8', 'beatstd').setValidators([Validators.min(0), Validators.max(997)]);
      this.getFormControl('section8', 'eq5d').setValidators([Validators.min(11111), Validators.max(55555)]);
      this.getFormControl('section8', 'sf12').setValidators([Validators.min(0), Validators.max(100)]);
      this.getFormControl('section8', 'vdatum').setValidators([this.dateSmallerOrEqualToToday(), this.dateGreaterThanValidator('section1', 'adatum')]);
      // Set validators of section 8hyb from WV-CAC 1.0.
      for (const field of ['leb24h', 'ztod']) {
        this.getFormControl('section8hyb', field).setValidators([Validators.required]);
      }
      this.getFormControl('section8hyb', 'dtod').setValidators([Validators.required, this.dateSmallerOrEqualToToday(), this.dateGreaterThanValidator('section1', 'adatum')]);
      this.wvProtocol.markAllAsTouched();
    }, error => {
      // Handle error of http get request.
      hf.handleErrors(error, this.authService, this.translate, this.messageViewer, this.router);
    });
    this.http.get<any>(MiddlewareURL + '/evprotnr', {headers: hf.getHeader()}).subscribe(data => {
      // Set units with measure unit data from database.
      this.evprotnrs = data.protocol;
      // Set accessToken.
      this.deleteProtnr(0);
      this.addProtnr();
      this.authService.setAccessToken(data);
    }, error => {
      // Handle error of http get request.
      hf.handleErrors(error, this.authService, this.translate, this.messageViewer, this.router);
    });

  }


  /**
   * Ask before reload.
   * @param event - Event
   * @returns void
   */
  @HostListener('window:beforeunload', ['$event']) unloadHandler(event: Event) {
    if (this.loaded) {
      event.returnValue = false;
    }
  }

  /**
   * Check whether a new protocol should be created.
   * @returns void
   */
  ngAfterViewInit(): void {
    // Get ID of protocol if existing from route snapshot.
    this.protocolId = (this.route.snapshot.paramMap.get('p') as string);
    // If new protocol show dialog and on close create protocol in database.
    if (!this.protocolId) {
      this.isLoaded = true;
      const dialogRef = this.dialog.open(DialogPatIdComponent, {width: '1000px', disableClose: true});
      dialogRef.afterClosed().subscribe(patid => {
        if (patid) {
          this.http.post<any>(MiddlewareURL + '/protocol/', {patid, maxRequired: 38, isValid: 1}, {headers: hf.getHeader()}).subscribe(data => {
              this.authService.setAccessToken(data);
              this.router.navigate(['/protocol', {p: data.protocol}]).then(() => {
                window.location.reload();
              });
            },
            error => {
              // Handle error of http post request.
              hf.handleErrors(error, this.authService, this.translate, this.messageViewer, this.router);
            });
        }
      });
    } else {
      this.loaded = true;
      this.loadValue();
      this.autoSave();
    }
  }

  /**
   * Validator function that checks if date of control is smaller or equal to today and returns a boolean value.
   * @returns ({ dateSmallerOrEqualToToday: boolean } | null) - Returns the error or null
   */
  dateSmallerOrEqualToToday(): (control: AbstractControl) => ({ dateSmallerOrEqualToToday: boolean } | null) {
    return (control: AbstractControl): { dateSmallerOrEqualToToday: boolean } | null => {
      return (moment(control.value).isAfter(moment(), 'day')) ? {dateSmallerOrEqualToToday: true} : null;
    };
  }

  /**
   * Checks if control date is greater than a specified date and returns a boolean value.
   * @param formgroup - Formgroup name
   * @param field - Field name
   * @returns ValidatorFn - Returns validation result
   */
  dateGreaterThanValidator(formgroup: any, field: any): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      return (control.value !== '' && moment(this.getFormControlValue(formgroup, field)).isAfter(moment(control.value), 'day')) ? {dateGreaterThanValidator: true} : null;
    };
  }

  /**
   * Checks if control time is greater than the a specified time of a corresponding date.
   * @param formgroup1 - Name of formgroup 1
   * @param dfield1 - Name of date field 1
   * @param zfield1 - Name of time field 1
   * @param formgroup2 - Name of formgroup 2
   * @param dfield2 - Name of date field 2
   * @returns ValidatorFn - Returns validation result
   */
  timeGreaterThanValidator(formgroup1: any, dfield1: any, zfield1: any, formgroup2: any, dfield2: any): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      return (control.value !== '' && moment(moment(this.getFormControlValue(formgroup1, dfield1)).format('l') + ' ' + this.getFormControlValue(formgroup1, zfield1), 'D.M.YYYY hh:mm').isAfter(moment(moment(this.getFormControlValue(formgroup2, dfield2)).format('l') + ' ' + control.value, 'D.M.YYYY hh:mm'))) ? {timeGreaterThanValidator: true} : null;
    };
  }

  /**
   * Get error message of given field.
     * @param formgroup - Formgroup name
   * @param field - Field name
   * @returns any - Returns error message
   */
  getErrorMessage(formgroup: string, field: string): any {
    if (this.getFormControl(formgroup, field).hasError('required')) {
      return this.translate.instant('error.required');
    } else {
      switch (field) {
        case 'adatum':
          if (this.getFormControl(formgroup, field).hasError('dateSmallerOrEqualToToday')) {
            return this.translate.instant('error.validators.datum_dateSmallerOrEqualToToday', {var1: moment(this.getFormControlValue(formgroup, field)).format('l'), var2: moment().format('l')});
          } else if (this.getFormControl(formgroup, field).hasError('dateGreaterThanValidator')) {
            return this.translate.instant('error.validators.datum_dateGreaterThanValidator', {var1: moment(this.getFormControlValue(formgroup, field)).format('l'), var2: moment(this.getFormControlValue('section1', 'datum')).format('l')});
          }
          break;
        case 'datum':
          return this.translate.instant('error.validators.datum_dateSmallerOrEqualToToday', {var1: moment(this.getFormControlValue(formgroup, field)).format('l'), var2: moment().format('l')});
        case 'patid':
          return this.getFormControl(formgroup, field).hasError('pattern') ? this.translate.instant('error.validators.patid') : '';
        case 'gebdat':
          return this.getFormControl(formgroup, field).hasError('dateSmallerOrEqualToToday') ? this.translate.instant('error.validators.' + field, {var1: this.getFormControlValue(formgroup, field).format('l'), var2: moment().format('l')}) : '';
        case 'ekgaufn':
          if (this.getFormControl(formgroup, field).hasError('min')) {
            return this.translate.instant('error.validators.ekgaufn_min');
          }
          break;
        case 'komplsek':
          if (this.getFormControl(formgroup, field).hasError('min')) {
            return this.translate.instant('error.validators.komplsek_min');
          }
          break;
        case 'instab':
          if (this.getFormControl(formgroup, field).hasError('min')) {
            return this.translate.instant('error.validators.instab_min');
          }
          break;
        case 'ecprkompl':
          if (this.getFormControl(formgroup, field).hasError('min')) {
            return this.translate.instant('error.validators.ecprkompl_min');
          }
          break;
        case 'amioda':
          if (this.getFormControl(formgroup, field).hasError('min')) {
            return this.translate.instant('error.validators.amioda_min', {var1: this.getFormControlValue(formgroup, field)});
          } else if (this.getFormControl(formgroup, field).hasError('max')) {
            return this.translate.instant('error.validators.amioda_max', {var1: this.getFormControlValue(formgroup, field)});
          }
          break;
        case 'adrena':
          if (this.getFormControl(formgroup, field).hasError('min')) {
            return this.translate.instant('error.validators.adrena_min', {var1: this.getFormControlValue(formgroup, field)});
          } else if (this.getFormControl(formgroup, field).hasError('max')) {
            return this.translate.instant('error.validators.adrena_max', {var1: this.getFormControlValue(formgroup, field)});
          }
          break;
        case 'rraufn':
          if (this.getFormControl(formgroup, field).hasError('min')) {
            return this.translate.instant('error.validators.rraufn_min', {var1: this.getFormControlValue(formgroup, field)});
          } else if (this.getFormControl(formgroup, field).hasError('max')) {
            return this.translate.instant('error.validators.rraufn_max', {var1: this.getFormControlValue(formgroup, field)});
          }
          break;
        case 'rrdaufn':
          if (this.getFormControl(formgroup, field).hasError('min')) {
            return this.translate.instant('error.validators.rrdaufn_min', {var1: this.getFormControlValue(formgroup, field)});
          } else if (this.getFormControl(formgroup, field).hasError('max')) {
            return this.translate.instant('error.validators.rrdaufn_max', {var1: this.getFormControlValue(formgroup, field)});
          }
          break;
        case 'hfaufn':
          if (this.getFormControl(formgroup, field).hasError('min')) {
            return this.translate.instant('error.validators.hfaufn_min', {var1: this.getFormControlValue(formgroup, field)});
          } else if (this.getFormControl(formgroup, field).hasError('max')) {
            return this.translate.instant('error.validators.hfaufn_max', {var1: this.getFormControlValue(formgroup, field)});
          }
          break;
        case 'afaufn':
          if (this.getFormControl(formgroup, field).hasError('min')) {
            return this.translate.instant('error.validators.afaufn_min', {var1: this.getFormControlValue(formgroup, field)});
          } else if (this.getFormControl(formgroup, field).hasError('max')) {
            return this.translate.instant('error.validators.afaufn_max', {var1: this.getFormControlValue(formgroup, field)});
          }
          break;
        case 'o2saufn':
          if (this.getFormControl(formgroup, field).hasError('min')) {
            return this.translate.instant('error.validators.o2saufn_min', {var1: this.getFormControlValue(formgroup, field)});
          } else if (this.getFormControl(formgroup, field).hasError('max')) {
            return this.translate.instant('error.validators.o2saufn_max', {var1: this.getFormControlValue(formgroup, field)});
          }
          break;
        case 'co2aufn':
          if (this.getMeasUnitForField(field) === 'mmHg') {
            if (this.getFormControl(formgroup, field).hasError('min')) {
              return this.translate.instant('error.validators.co2aufn_mmhg_min', {var1: this.getFormControlValue(formgroup, field)});
            } else if (this.getFormControl(formgroup, field).hasError('max')) {
              return this.translate.instant('error.validators.co2aufn_mmhg_max', {var1: this.getFormControlValue(formgroup, field)});
            }
          } else if (this.getMeasUnitForField(field) === 'kPa') {
            if (this.getFormControl(formgroup, field).hasError('min')) {
              return this.translate.instant('error.validators.co2aufn_kpa_min', {var1: this.getFormControlValue(formgroup, field)});
            } else if (this.getFormControl(formgroup, field).hasError('max')) {
              return this.translate.instant('error.validators.co2aufn_kpa_max', {var1: this.getFormControlValue(formgroup, field)});
            }
          }
          break;
        case 'tempaufn':
          if (this.getFormControl(formgroup, field).hasError('min')) {
            return this.translate.instant('error.validators.tempaufn_min', {var1: this.getFormControlValue(formgroup, field)});
          } else if (this.getFormControl(formgroup, field).hasError('max')) {
            return this.translate.instant('error.validators.tempaufn_max', {var1: this.getFormControlValue(formgroup, field)});
          }
          break;
        case 'hbaufn':
          if (this.getMeasUnitForField(field) === 'g/dl') {
            if (this.getFormControl(formgroup, field).hasError('min')) {
              return this.translate.instant('error.validators.hbaufn_gdl_min', {var1: this.getFormControlValue(formgroup, field)});
            } else if (this.getFormControl(formgroup, field).hasError('max')) {
              return this.translate.instant('error.validators.hbaufn_gdl_max', {var1: this.getFormControlValue(formgroup, field)});
            }
          } else if (this.getMeasUnitForField(field) === 'g/l') {
            if (this.getFormControl(formgroup, field).hasError('min')) {
              return this.translate.instant('error.validators.hbaufn_gl_min', {var1: this.getFormControlValue(formgroup, field)});
            } else if (this.getFormControl(formgroup, field).hasError('max')) {
              return this.translate.instant('error.validators.hbaufn_gl_max', {var1: this.getFormControlValue(formgroup, field)});
            }
          }
          break;
        case 'phaufn':
          if (this.getFormControl(formgroup, field).hasError('min')) {
            return this.translate.instant('error.validators.phaufn_min', {var1: this.getFormControlValue(formgroup, field)});
          } else if (this.getFormControl(formgroup, field).hasError('max')) {
            return this.translate.instant('error.validators.phaufn_max', {var1: this.getFormControlValue(formgroup, field)});
          }
          break;
        case 'beaufn':
          if (this.getFormControl(formgroup, field).hasError('min')) {
            return this.translate.instant('error.validators.beaufn_min', {var1: this.getFormControlValue(formgroup, field)});
          } else if (this.getFormControl(formgroup, field).hasError('max')) {
            return this.translate.instant('error.validators.beaufn_max', {var1: this.getFormControlValue(formgroup, field)});
          }
          break;
        case 'pco2aufn':
          if (this.getFormControl(formgroup, field).hasError('min')) {
            return this.translate.instant('error.validators.pco2aufn_min', {var1: this.getFormControlValue(formgroup, field)});
          } else if (this.getFormControl(formgroup, field).hasError('max')) {
            return this.translate.instant('error.validators.pco2aufn_max', {var1: this.getFormControlValue(formgroup, field)});
          }
          break;
        case 'lactaufn':
          if (this.getMeasUnitForField(field) === 'mg/dl') {
            if (this.getFormControl(formgroup, field).hasError('min')) {
              return this.translate.instant('error.validators.lactaufn_mgdl_min', {var1: this.getFormControlValue(formgroup, field)});
            } else if (this.getFormControl(formgroup, field).hasError('max')) {
              return this.translate.instant('error.validators.lactaufn_mgdl_max', {var1: this.getFormControlValue(formgroup, field)});
            }
          } else if (this.getMeasUnitForField(field) === 'mmol/l') {
            if (this.getFormControl(formgroup, field).hasError('min')) {
              return this.translate.instant('error.validators.lactaufn_mmol_min', {var1: this.getFormControlValue(formgroup, field)});
            } else if (this.getFormControl(formgroup, field).hasError('max')) {
              return this.translate.instant('error.validators.lactaufn_mmol_max', {var1: this.getFormControlValue(formgroup, field)});
            }
          }
          break;
        case 'bzaufn':
          if (this.getMeasUnitForField(field) === 'mg/dl') {
            if (this.getFormControl(formgroup, field).hasError('min')) {
              return this.translate.instant('error.validators.bzaufn_mgdl_min', {var1: this.getFormControlValue(formgroup, field)});
            } else if (this.getFormControl(formgroup, field).hasError('max')) {
              return this.translate.instant('error.validators.bzaufn_mgdl_max', {var1: this.getFormControlValue(formgroup, field)});
            }
          } else if (this.getMeasUnitForField(field) === 'mmol/l') {
            if (this.getFormControl(formgroup, field).hasError('min')) {
              return this.translate.instant('error.validators.bzaufn_mmoll_min', {var1: this.getFormControlValue(formgroup, field)});
            } else if (this.getFormControl(formgroup, field).hasError('max')) {
              return this.translate.instant('error.validators.bzaufn_mmoll_max', {var1: this.getFormControlValue(formgroup, field)});
            }
          }
          break;
        case 'kreaaufn':
          if (this.getMeasUnitForField(field) === 'mg/dl') {
            if (this.getFormControl(formgroup, field).hasError('min')) {
              return this.translate.instant('error.validators.kreaaufn_mgdl_min', {var1: this.getFormControlValue(formgroup, field)});
            } else if (this.getFormControl(formgroup, field).hasError('max')) {
              return this.translate.instant('error.validators.kreaaufn_mgdl_max', {var1: this.getFormControlValue(formgroup, field)});
            }
          } else if (this.getMeasUnitForField(field) === 'μmol/l') {
            if (this.getFormControl(formgroup, field).hasError('min')) {
              return this.translate.instant('error.validators.kreaaufn_μmoll_min', {var1: this.getFormControlValue(formgroup, field)});
            } else if (this.getFormControl(formgroup, field).hasError('max')) {
              return this.translate.instant('error.validators.kreaaufn_μmoll_max', {var1: this.getFormControlValue(formgroup, field)});
            }
          }
          break;
        case 'troponw':
          if (this.getFormControl(formgroup, field).hasError('min')) {
            return this.translate.instant('error.validators.troponw_min', {var1: this.getFormControlValue(formgroup, field)});
          } else if (this.getFormControl(formgroup, field).hasError('max')) {
            return this.translate.instant('error.validators.troponw_max', {var1: this.getFormControlValue(formgroup, field)});
          }
          break;
        case 'tropaaufn':
          if (this.getFormControl(formgroup, field).hasError('min')) {
            return this.translate.instant('error.validators.tropaaufn_min', {var1: this.getFormControlValue(formgroup, field)});
          } else if (this.getFormControl(formgroup, field).hasError('max')) {
            return this.translate.instant('error.validators.tropaaufn_max', {var1: this.getFormControlValue(formgroup, field)});
          }
          break;
        case 'tropaufn':
          if (this.getFormControl(formgroup, field).hasError('min')) {
            return this.translate.instant('error.validators.tropaufn_min', {var1: this.getFormControlValue(formgroup, field)});
          } else if (this.getFormControl(formgroup, field).hasError('max')) {
            return this.translate.instant('error.validators.tropaufn_max', {var1: this.getFormControlValue(formgroup, field)});
          }
          break;
        case 'trop2aaufn':
          if (this.getFormControl(formgroup, field).hasError('min')) {
            return this.translate.instant('error.validators.trop2aaufn_min', {var1: this.getFormControlValue(formgroup, field)});
          } else if (this.getFormControl(formgroup, field).hasError('max')) {
            return this.translate.instant('error.validators.trop2aaufn_max', {var1: this.getFormControlValue(formgroup, field)});
          }
          break;
        case 'trop2aufn':
          if (this.getFormControl(formgroup, field).hasError('min')) {
            return this.translate.instant('error.validators.trop2aufn_min', {var1: this.getFormControlValue(formgroup, field)});
          } else if (this.getFormControl(formgroup, field).hasError('max')) {
            return this.translate.instant('error.validators.trop2aufn_max', {var1: this.getFormControlValue(formgroup, field)});
          }
          break;
        case 'bnpaufn':
          if (this.getFormControl(formgroup, field).hasError('min')) {
            return this.translate.instant('error.validators.bnpaufn_min', {var1: this.getFormControlValue(formgroup, field)});
          } else if (this.getFormControl(formgroup, field).hasError('max')) {
            return this.translate.instant('error.validators.bnpaufn_max', {var1: this.getFormControlValue(formgroup, field)});
          }
          break;
        case 'rrziel3':
          if (this.getFormControl(formgroup, field).hasError('min')) {
            return this.translate.instant('error.validators.rrziel3_min', {var1: this.getFormControlValue(formgroup, field)});
          } else if (this.getFormControl(formgroup, field).hasError('max')) {
            return this.translate.instant('error.validators.rrziel3_max', {var1: this.getFormControlValue(formgroup, field)});
          }
          break;
        case 'dekg12':
          if (this.getFormControl(formgroup, field).hasError('dateSmallerOrEqualToToday')) {
            return this.translate.instant('error.validators.dekg12_dateSmallerOrEqualToToday', {var1: this.getFormControlValue(formgroup, field).format('l'), var2: moment().format('l')});
          } else if (this.getFormControl(formgroup, field).hasError('dateGreaterThanValidator')) {
            return this.translate.instant('error.validators.dekg12_dateGreaterThanValidator', {var1: this.getFormControlValue(formgroup, field).format('l'), var2: this.getFormControlValue('section1', 'adatum').format('l')});
          }
          break;
        case 'zekg12':
          if (this.getFormControl(formgroup, field).hasError('timeGreaterThanValidator')) {
            return this.translate.instant('error.validators.zekg12_timeGreaterThanValidator', {var1: this.getFormControlValue(formgroup, field), var2: this.getFormControlValue('section1', 'zadatum')});
          }
          break;
        case 'zct':
          if (this.getFormControl(formgroup, field).hasError('timeGreaterThanValidator')) {
            return this.translate.instant('error.validators.zct_timeGreaterThanValidator', {var1: this.getFormControlValue(formgroup, field), var2: this.getFormControlValue('section1', 'zadatum')});
          }
          break;
        case 'zcoro':
          if (this.getFormControl(formgroup, field).hasError('timeGreaterThanValidator')) {
            return this.translate.instant('error.validators.zcoro_timeGreaterThanValidator', {var1: this.getFormControlValue(formgroup, field), var2: this.getFormControlValue('section1', 'zadatum')});
          }
          break;
        case 'zecls':
          if (this.getFormControl(formgroup, field).hasError('timeGreaterThanValidator')) {
            return this.translate.instant('error.validators.zecls_timeGreaterThanValidator', {var1: this.getFormControlValue(formgroup, field), var2: this.getFormControlValue('section1', 'zadatum')});
          }
          break;
        case 'ziabp':
          if (this.getFormControl(formgroup, field).hasError('timeGreaterThanValidator')) {
            return this.translate.instant('error.validators.ziabp_timeGreaterThanValidator', {var1: this.getFormControlValue(formgroup, field), var2: this.getFormControlValue('section1', 'zadatum')});
          }
          break;
        case 'zimpella':
          if (this.getFormControl(formgroup, field).hasError('timeGreaterThanValidator')) {
            return this.translate.instant('error.validators.zimpella_timeGreaterThanValidator', {var1: this.getFormControlValue(formgroup, field), var2: this.getFormControlValue('section1', 'zadatum')});
          }
          break;
        case 'zlyse':
          if (this.getFormControl(formgroup, field).hasError('timeGreaterThanValidator')) {
            return this.translate.instant('error.validators.zlyse_timeGreaterThanValidator', {var1: this.getFormControlValue(formgroup, field), var2: this.getFormControlValue('section1', 'zadatum')});
          }
          break;
        case 'ecprzst':
          if (this.getFormControl(formgroup, field).hasError('timeGreaterThanValidator')) {
            return this.translate.instant('error.validators.ecprzst_timeGreaterThanValidator', {var1: this.getFormControlValue(formgroup, field), var2: this.getFormControlValue('section5', 'ecprzbk')});
          }
          break;
        case 'ecprzend':
          if (this.getFormControl(formgroup, field).hasError('timeGreaterThanValidator')) {
            return this.translate.instant('error.validators.ecprzend_timeGreaterThanValidator', {var1: this.getFormControlValue(formgroup, field), var2: this.getFormControlValue('section5', 'ecprzst')});
          }
          break;
        case 'zkuehlbeg':
          if (this.getFormControl(formgroup, field).hasError('timeGreaterThanValidator')) {
            return this.translate.instant('error.validators.zkuehlbeg_timeGreaterThanValidator', {var1: this.getFormControlValue(formgroup, field), var2: this.getFormControlValue('section1', 'zadatum')});
          }
          break;
        case 'zzieltemp':
          if (this.getFormControl(formgroup, field).hasError('timeGreaterThanValidator')) {
            return this.translate.instant('error.validators.zzieltemp_timeGreaterThanValidator', {var1: this.getFormControlValue(formgroup, field), var2: this.getFormControlValue('section6', 'zkuehlbeg')});
          }
          break;
        case 'dct':
          if (this.getFormControl(formgroup, field).hasError('dateSmallerOrEqualToToday')) {
            return this.translate.instant('error.validators.dct_dateSmallerOrEqualToToday', {var1: this.getFormControlValue(formgroup, field).format('l'), var2: moment().format('l')});
          } else if (this.getFormControl(formgroup, field).hasError('dateGreaterThanValidator')) {
            return this.translate.instant('error.validators.dct_dateGreaterThanValidator', {var1: this.getFormControlValue(formgroup, field).format('l'), var2: this.getFormControlValue('section1', 'adatum').format('l')});
          }
          break;
        case 'dcoro':
          if (this.getFormControl(formgroup, field).hasError('dateSmallerOrEqualToToday')) {
            return this.translate.instant('error.validators.dcoro_dateSmallerOrEqualToToday', {var1: this.getFormControlValue(formgroup, field).format('l'), var2: moment().format('l')});
          } else if (this.getFormControl(formgroup, field).hasError('dateGreaterThanValidator')) {
            return this.translate.instant('error.validators.dcoro_dateGreaterThanValidator', {var1: this.getFormControlValue(formgroup, field).format('l'), var2: this.getFormControlValue('section1', 'adatum').format('l')});
          }
          break;
        case 'decls':
          if (this.getFormControl(formgroup, field).hasError('dateSmallerOrEqualToToday')) {
            return this.translate.instant('error.validators.decls_dateSmallerOrEqualToToday', {var1: this.getFormControlValue(formgroup, field).format('l'), var2: moment().format('l')});
          } else if (this.getFormControl(formgroup, field).hasError('dateGreaterThanValidator')) {
            return this.translate.instant('error.validators.decls_dateGreaterThanValidator', {var1: this.getFormControlValue(formgroup, field).format('l'), var2: this.getFormControlValue('section1', 'adatum').format('l')});
          }
          break;
        case 'diabp':
          if (this.getFormControl(formgroup, field).hasError('dateSmallerOrEqualToToday')) {
            return this.translate.instant('error.validators.diabp_dateSmallerOrEqualToToday', {var1: this.getFormControlValue(formgroup, field).format('l'), var2: moment().format('l')});
          } else if (this.getFormControl(formgroup, field).hasError('dateGreaterThanValidator')) {
            return this.translate.instant('error.validators.diabp_dateGreaterThanValidator', {var1: this.getFormControlValue(formgroup, field).format('l'), var2: this.getFormControlValue('section1', 'adatum').format('l')});
          }
          break;
        case 'dimpella':
          if (this.getFormControl(formgroup, field).hasError('dateSmallerOrEqualToToday')) {
            return this.translate.instant('error.validators.dimpella_dateSmallerOrEqualToToday', {var1: this.getFormControlValue(formgroup, field).format('l'), var2: moment().format('l')});
          } else if (this.getFormControl(formgroup, field).hasError('dateGreaterThanValidator')) {
            return this.translate.instant('error.validators.dimpella_dateGreaterThanValidator', {var1: this.getFormControlValue(formgroup, field).format('l'), var2: this.getFormControlValue('section1', 'adatum').format('l')});
          }
          break;
        case 'dlyse':
          if (this.getFormControl(formgroup, field).hasError('dateSmallerOrEqualToToday')) {
            return this.translate.instant('error.validators.dlyse_dateSmallerOrEqualToToday', {var1: this.getFormControlValue(formgroup, field).format('l'), var2: moment().format('l')});
          } else if (this.getFormControl(formgroup, field).hasError('dateGreaterThanValidator')) {
            return this.translate.instant('error.validators.dlyse_dateGreaterThanValidator', {var1: this.getFormControlValue(formgroup, field).format('l'), var2: this.getFormControlValue('section1', 'adatum').format('l')});
          }
          break;
        case 'ecprdbk':
          if (this.getFormControl(formgroup, field).hasError('dateSmallerOrEqualToToday')) {
            return this.translate.instant('error.validators.ecprdbk_dateSmallerOrEqualToToday', {var1: this.getFormControlValue(formgroup, field).format('l'), var2: moment().format('l')});
          } else if (this.getFormControl(formgroup, field).hasError('dateGreaterThanValidator')) {
            return this.translate.instant('error.validators.ecprdbk_dateGreaterThanValidator', {var1: this.getFormControlValue(formgroup, field).format('l'), var2: this.getFormControlValue('section1', 'datum').format('l')});
          }
          break;
        case 'ecprdst':
          if (this.getFormControl(formgroup, field).hasError('dateSmallerOrEqualToToday')) {
            return this.translate.instant('error.validators.ecprdst_dateSmallerOrEqualToToday', {var1: this.getFormControlValue(formgroup, field).format('l'), var2: moment().format('l')});
          } else if (this.getFormControl(formgroup, field).hasError('dateGreaterThanValidator')) {
            return this.translate.instant('error.validators.ecprdst_dateGreaterThanValidator', {var1: this.getFormControlValue(formgroup, field).format('l'), var2: this.getFormControlValue('section5', 'ecprdbk').format('l')});
          }
          break;
        case 'ecprdend':
          if (this.getFormControl(formgroup, field).hasError('dateSmallerOrEqualToToday')) {
            return this.translate.instant('error.validators.ecprdend_dateSmallerOrEqualToToday', {var1: this.getFormControlValue(formgroup, field).format('l'), var2: moment().format('l')});
          } else if (this.getFormControl(formgroup, field).hasError('dateGreaterThanValidator')) {
            return this.translate.instant('error.validators.ecprdend_dateGreaterThanValidator', {var1: this.getFormControlValue(formgroup, field).format('l'), var2: this.getFormControlValue('section5', 'ecprdst').format('l')});
          }
          break;
        case 'dkuehlbeg':
          if (this.getFormControl(formgroup, field).hasError('dateSmallerOrEqualToToday')) {
            return this.translate.instant('error.validators.dkuehlbeg_dateSmallerOrEqualToToday', {var1: this.getFormControlValue(formgroup, field).format('l'), var2: moment().format('l')});
          } else if (this.getFormControl(formgroup, field).hasError('dateGreaterThanValidator')) {
            return this.translate.instant('error.validators.dkuehlbeg_dateGreaterThanValidator', {var1: this.getFormControlValue(formgroup, field).format('l'), var2: this.getFormControlValue('section1', 'adatum').format('l')});
          }
          break;
        case 'dzieltemp':
          if (this.getFormControl(formgroup, field).hasError('dateSmallerOrEqualToToday')) {
            return this.translate.instant('error.validators.dzieltemp_dateSmallerOrEqualToToday', {var1: this.getFormControlValue(formgroup, field).format('l'), var2: moment().format('l')});
          } else if (this.getFormControl(formgroup, field).hasError('dateGreaterThanValidator')) {
            return this.translate.instant('error.validators.dzieltemp_dateGreaterThanValidator', {var1: this.getFormControlValue(formgroup, field).format('l'), var2: this.getFormControlValue('section6', 'dkuehlbeg').format('l')});
          }
          break;
        case 'entldat':
          if (this.getFormControl(formgroup, field).hasError('dateSmallerOrEqualToToday')) {
            return this.translate.instant('error.validators.entldat_dateSmallerOrEqualToToday', {var1: this.getFormControlValue(formgroup, field).format('l'), var2: moment().format('l')});
          } else if (this.getFormControl(formgroup, field).hasError('dateGreaterThanValidator')) {
            return this.translate.instant('error.validators.entldat_dateGreaterThanValidator', {var1: this.getFormControlValue(formgroup, field).format('l'), var2: this.getFormControlValue('section1', 'adatum').format('l')});
          }
          break;
        case 'vdatum':
          if (this.getFormControl(formgroup, field).hasError('dateSmallerOrEqualToToday')) {
            return this.translate.instant('error.validators.vdatum_dateSmallerOrEqualToToday', {var1: this.getFormControlValue(formgroup, field).format('l'), var2: moment().format('l')});
          } else if (this.getFormControl(formgroup, field).hasError('dateGreaterThanValidator')) {
            return this.translate.instant('error.validators.vdatum_dateGreaterThanValidator', {var1: this.getFormControlValue(formgroup, field).format('l'), var2: this.getFormControlValue('section1', 'adatum').format('l')});
          }
          break;
        case 'dtod':
          if (this.getFormControl(formgroup, field).hasError('dateSmallerOrEqualToToday')) {
            return this.translate.instant('error.validators.dtod_dateSmallerOrEqualToToday', {var1: this.getFormControlValue(formgroup, field).format('l'), var2: moment().format('l')});
          } else if (this.getFormControl(formgroup, field).hasError('dateGreaterThanValidator')) {
            return this.translate.instant('error.validators.dtod_dateGreaterThanValidator', {var1: this.getFormControlValue(formgroup, field).format('l'), var2: this.getFormControlValue('section1', 'adatum').format('l')});
          }
          break;
        case 'ecprlact':
          if (this.getMeasUnitForField(field) === 'mg/dl') {
            if (this.getFormControl(formgroup, field).hasError('min')) {
              return this.translate.instant('error.validators.ecprlact_mgdl_min', {var1: this.getFormControlValue(formgroup, field)});
            } else if (this.getFormControl(formgroup, field).hasError('max')) {
              return this.translate.instant('error.validators.ecprlact_mgdl_max', {var1: this.getFormControlValue(formgroup, field)});
            }
          } else if (this.getMeasUnitForField(field) === 'mmol/l') {
            if (this.getFormControl(formgroup, field).hasError('min')) {
              return this.translate.instant('error.validators.ecprlact_mmoll_min', {var1: this.getFormControlValue(formgroup, field)});
            } else if (this.getFormControl(formgroup, field).hasError('max')) {
              return this.translate.instant('error.validators.ecprlact_mmoll_max', {var1: this.getFormControlValue(formgroup, field)});
            }
          }
          break;
        case 'ecprph':
          if (this.getFormControl(formgroup, field).hasError('min')) {
            return this.translate.instant('error.validators.ecprph_min', {var1: this.getFormControlValue(formgroup, field)});
          } else if (this.getFormControl(formgroup, field).hasError('max')) {
            return this.translate.instant('error.validators.ecprph_max', {var1: this.getFormControlValue(formgroup, field)});
          }
          break;
        case 'ecprbe':
          if (this.getFormControl(formgroup, field).hasError('min')) {
            return this.translate.instant('error.validators.ecprbe_min', {var1: this.getFormControlValue(formgroup, field)});
          } else if (this.getFormControl(formgroup, field).hasError('max')) {
            return this.translate.instant('error.validators.ecprbe_max', {var1: this.getFormControlValue(formgroup, field)});
          }
          break;
        case 'ecprpco2':
          if (this.getMeasUnitForField(field) === 'mmHg') {
            if (this.getFormControl(formgroup, field).hasError('min')) {
              return this.translate.instant('error.validators.ecprpco2_mmhg_min', {var1: this.getFormControlValue(formgroup, field)});
            } else if (this.getFormControl(formgroup, field).hasError('max')) {
              return this.translate.instant('error.validators.ecprpco2_mmhg_max', {var1: this.getFormControlValue(formgroup, field)});
            }
          } else if (this.getMeasUnitForField(field) === 'kPa') {
            if (this.getFormControl(formgroup, field).hasError('min')) {
              return this.translate.instant('error.validators.ecprpco2_kpa_min', {var1: this.getFormControlValue(formgroup, field)});
            } else if (this.getFormControl(formgroup, field).hasError('max')) {
              return this.translate.instant('error.validators.ecprpco2_kpa_max', {var1: this.getFormControlValue(formgroup, field)});
            }
          }
          break;
        case 'ecprpao2':
          if (this.getMeasUnitForField(field) === 'mmHg') {
            if (this.getFormControl(formgroup, field).hasError('min')) {
              return this.translate.instant('error.validators.ecprpao2_mmhg_min', {var1: this.getFormControlValue(formgroup, field)});
            } else if (this.getFormControl(formgroup, field).hasError('max')) {
              return this.translate.instant('error.validators.ecprpao2_mmhg_max', {var1: this.getFormControlValue(formgroup, field)});
            }
          } else if (this.getMeasUnitForField(field) === 'kPa') {
            if (this.getFormControl(formgroup, field).hasError('min')) {
              return this.translate.instant('error.validators.ecprpao2_kpa_min', {var1: this.getFormControlValue(formgroup, field)});
            } else if (this.getFormControl(formgroup, field).hasError('max')) {
              return this.translate.instant('error.validators.ecprpao2_kpa_max', {var1: this.getFormControlValue(formgroup, field)});
            }
          }
          break;
        case 'icutage':
          if (this.getFormControl(formgroup, field).hasError('min')) {
            return this.translate.instant('error.validators.icutage_min', {var1: this.getFormControlValue(formgroup, field)});
          } else if (this.getFormControl(formgroup, field).hasError('max')) {
            if (this.getFormControlValue('section8hyb', 'leb24h') === '02') {
              return this.translate.instant('error.validators.icutage_max_leb24h', {var1: this.getFormControlValue(formgroup, field)});
            } else {
              return this.translate.instant('error.validators.icutage_max', {var1: this.getFormControlValue(formgroup, field)});
            }
          }
          break;
        case 'beatstd':
          if (this.getFormControl(formgroup, field).hasError('min')) {
            return this.translate.instant('error.validators.beatstd_min', {var1: this.getFormControlValue(formgroup, field)});
          } else if (this.getFormControl(formgroup, field).hasError('max')) {
            if (this.getFormControlValue('section8hyb', 'leb24h') === '02') {
              return this.translate.instant('error.validators.beatstd_max_leb24h', {var1: this.getFormControlValue(formgroup, field)});
            } else {
              return this.translate.instant('error.validators.beatstd_max', {var1: this.getFormControlValue(formgroup, field)});
            }
          }
          break;
        case 'eq5d':
          if (this.getFormControl(formgroup, field).hasError('min')) {
            return this.translate.instant('error.validators.eq5d_min', {var1: this.getFormControlValue(formgroup, field)});
          } else if (this.getFormControl(formgroup, field).hasError('max')) {
            return this.translate.instant('error.validators.eq5d_max', {var1: this.getFormControlValue(formgroup, field)});
          }
          break;
        case 'sf12':
          if (this.getFormControl(formgroup, field).hasError('min')) {
            return this.translate.instant('error.validators.sf12_min', {var1: this.getFormControlValue(formgroup, field)});
          } else if (this.getFormControl(formgroup, field).hasError('max')) {
            return this.translate.instant('error.validators.sf12_max', {var1: this.getFormControlValue(formgroup, field)});
          }
          break;
      }
    }
  }

  /**
   * Check if radio button isempty, required and has been touched.
   * @param formgroup - Formgroup name
   * @param field - Field name
   * @returns boolean - Returns if radio button has error
   */
  radioButtonErrorCheck(formgroup: any, field: any): boolean {
    return (this.getFormControl(formgroup, field).hasError('required') && (this.getFormControl(formgroup, field).touched));
  }

  /**
   * Get FormGroup.
   * @param formgroup - Formgroup name
   * @returns any - Returns the FormGroup
   */
  getFormGroup(formgroup: string): any {
    return this.wvProtocol.controls[formgroup];
  }

  /**
   * Get FormControl of given field.
   * @param formgroup - Formgroup name
   * @param field - Field name
   * @returns any - Returns Formcontrol
   */
  getFormControl(formgroup: string, field: string): any {
    return this.wvProtocol.controls[formgroup].controls[field];
  }

  /**
   * Get value of FormControl of given field.
   * @param formgroup - Formgroup name
   * @param field - Field name
   * @returns any - Returns value of FormControl
   */
  getFormControlValue(formgroup: string, field: string): any {
    return this.getFormControl(formgroup, field) ? this.getFormControl(formgroup, field).value : null;
  }

  /**
   * Set FormControlValue of a FormControl from wvProtocol form.
   * @param formgroup - Formgroup name
   * @param field - Field name
   * @param value - Value to set
   * @returns void
   */
  setFormControlValue(formgroup: string, field: string, value: any): void {
    this.getFormControl(formgroup, field).setValue(value);
  }

  /**
   * Delete protocol.
   * @returns void
   */
  delete(): void {
    // Renewed query via a dialogue whether the user really wants to be deleted.
    const title = this.translate.instant('protocolPage.confirmTitle', {patid: this.getFormControlValue('section1', 'patid')});
    const dialogRef = this.dialog.open(DialogConfirmComponent, {width: '300px', data: {title}});
    dialogRef.afterClosed().subscribe(result => {
      // When delete is clicked in the dialog delete protocol.
      if (result) {
        this.http.delete<any>(MiddlewareURL + '/protocol/' + this.protocolId, {headers: hf.getHeader()}).subscribe(data => {
            // When user is deleted show notification and redirect to overview.
            this.authService.setAccessToken(data);
            hf.successNotification(this.translate.instant('protocolPage.success.deleted', {patid: this.getFormControlValue('section1', 'patid')}), this.translate, this.messageViewer);
            this.router.navigate(['/overview']);
          },
          error => {
            // Handle error of http delete request.
            hf.handleErrors(error, this.authService, this.translate, this.messageViewer, this.router);
          });
      }
    });
  }

  /**
   * Get Measuring unit of a given field.
   * @param field - Field name
   * @returns string - Returns measuring unit
   */
  getMeasUnitForField(field: string): string {
    if (this.units) {
      for (const unit of this.units) {
        if (unit.measField === field) {
          // For the fields co2aufn, ecprpco2 and ecprpao2 the following coding applies: 1 = mmHg and 2= kPa.
          if (field === 'co2aufn' || field === 'ecprpco2' || field === 'ecprpao2') {
            if (unit.measValue === 1) {
              return 'mmHg';
            } else if (unit.measValue === 2) {
              return 'kPa';
            }
          }
          // For the field hbaufn the following coding applies: 1 = g/l and 2= g/dl.
          else if (field === 'hbaufn') {
            if (unit.measValue === 1) {
              return 'g/l';
            } else if (unit.measValue === 2) {
              return 'g/dl';
            }
          }
          // For the fields lactaufn, ecprlact and bzaufn the following coding applies: 1 = mg/dl and 2= mmol/l.
          else if (field === 'lactaufn' || field === 'ecprlact' || field === 'bzaufn') {
            if (unit.measValue === 1) {
              return 'mg/dl';
            } else if (unit.measValue === 2) {
              return 'mmol/l';
            }
          }
          // For the field kreaaufn the following coding applies: 1 = mg/dl and 2= μmol/l.
          else if (field === 'kreaaufn') {
            if (unit.measValue === 1) {
              return 'mg/dl';
            } else if (unit.measValue === 2) {
              return 'μmol/l';
            }
          }
        }
      }
    }
    return '';
  }

  /**
   * Open dialog with field information (title and description).
   * @param title - Title of dialog
   * @param content - Content of dialog
   * @returns void
   */
  openDialogInfo(title: string, content: string): void {
    this.dialog.open(DialogComponent, {data: {title, content}, width: '300px'});
  }

  /**
   * Get date of today.
   * @returns Moment - Returns the date of today as a moment object
   */
  getTodaysDate(): Moment {
    const date = new Date();
    return moment(date.toISOString().split('T')[0]);
  }

  /**
   * Set current time of a given field with moment.
   * @param formgroup - Formgroup name
   * @param field - Field name
   * @returns void
   */
  setTime(formgroup: string, field: string): void {
    this.setFormControlValue(formgroup, field, moment().format('LT'));
    this.getFormControl(formgroup, field).markAsTouched();
    this.getFormControl(formgroup, field).markAsDirty();
    this.getFormControl(formgroup, field).updateValueAndValidity();
  }


  /**
   * Handles validator logic if a date is changed.
   * @param formgroup - Formgroup name
   * @param field - Field name
     * @returns void
   */
  onChangeDate(formgroup: any, field: any): void {
    if (field === 'datum') {
      this.getFormControl('section1', 'adatum').updateValueAndValidity();
      this.getFormControl('section1', 'zadatum').updateValueAndValidity();
    } else if (field === 'gebdat') {
      this.setFormControlValue(formgroup, field + 'R', null);
      this.getFormControl(formgroup, field).setValidators([Validators.required, this.dateSmallerOrEqualToToday()]);
      this.getFormControl(formgroup, field).updateValueAndValidity();
    } else if (field === 'adatum') {
      this.setFormControlValue(formgroup, field + 'R', null);
      this.getFormControl(formgroup, field).setValidators([Validators.required, this.dateSmallerOrEqualToToday(), this.dateGreaterThanValidator('section1', 'datum')]);
      this.getFormControl(formgroup, field).updateValueAndValidity();
      for (const item of ['ekg12', 'ct', 'coro', 'ecls', 'iabp', 'impella']) {
        this.getFormControl('section4', 'd' + item).updateValueAndValidity();
        this.getFormControl('section4', 'z' + item).updateValueAndValidity();
      }
      this.getFormControl('section4hyb', 'dlyse').updateValueAndValidity();
      this.getFormControl('section4hyb', 'zlyse').updateValueAndValidity();
      this.getFormControl('section8', 'entldat').updateValueAndValidity();
      this.getFormControl('section6', 'dkuehlbeg').updateValueAndValidity();
      this.getFormControl('section6', 'zkuehlbeg').updateValueAndValidity();
      this.getFormControl('section8hyb', 'dtod').updateValueAndValidity();
      this.getFormControl('section8hyb', 'ztod').updateValueAndValidity();
      for (const item of ['vdatum']) {
        this.getFormControl('section8', item).updateValueAndValidity();
      }
    } else if (['dekg12', 'dct', 'dcoro', 'dlyse', 'decls', 'diabp', 'dimpella', 'dkuehlbeg'].includes(field)) {
      if (this.getFormControlValue(formgroup, 'z' + field.substring(1)) !== '' && this.getFormControlValue(formgroup, 'z' + field.substring(1))) {
        this.getFormControl(formgroup, 'z' + field.substring(1)).markAsTouched();
        this.getFormControl(formgroup, 'z' + field.substring(1)).updateValueAndValidity();
      }
    } else if (field === 'ecprdbk') {
      this.getFormControl('section5', 'ecprdst').updateValueAndValidity();
      this.getFormControl('section5', 'ecprdend').updateValueAndValidity();
      this.getFormControl('section5', 'ecprzst').updateValueAndValidity();
      this.getFormControl('section5', 'ecprzend').updateValueAndValidity();
    } else if (field === 'ecprdst') {
      if (this.getFormControlValue(formgroup, 'ecprzst') !== '' && this.getFormControlValue(formgroup, 'ecprzst')) {
        this.getFormControl(formgroup, 'ecprzst').markAsTouched();
        this.getFormControl(formgroup, 'ecprzst').updateValueAndValidity();
      }
      this.getFormControl('section5', 'ecprdend').updateValueAndValidity();
    } else if (field === 'ecprdend') {
      if (this.getFormControlValue(formgroup, 'ecprzend') !== '' && this.getFormControlValue(formgroup, 'ecprzend')) {
        this.getFormControl(formgroup, 'ecprzend').markAsTouched();
        this.getFormControl(formgroup, 'ecprzend').updateValueAndValidity();
      }
    } else if (field === 'dtod') {
      this.setFormControlValue(formgroup, field + 'R', null);
      this.getFormControl(formgroup, 'dtod').setValidators([Validators.required, this.dateSmallerOrEqualToToday(), this.dateGreaterThanValidator('section1', 'adatum')]);
      this.getFormControl(formgroup, 'dtod').updateValueAndValidity();
    }
    if (['dkuehlbeg', 'dzieltemp'].includes(field)) {
      this.getFormControl('section6', 'dzieltemp').updateValueAndValidity();
      this.getFormControl('section6', 'zzieltemp').updateValueAndValidity();
    }
  }

  /**
   * Handles validator logic when a input field is changed.
   * @param formgroup - Formgroup name
   * @param field - Field name
   * @returns void
   */
  onChangeField(formgroup: any, field: any): void {
    this.setFormControlValue(formgroup, field + 'R', null);
    this.resetValidators(formgroup, field);
    this.getFormControl(formgroup, field).updateValueAndValidity();
  }

  /**
   * Handles validator logic when a radio-button of input field is changed.
   * @param formgroup - Formgroup name
   * @param field - Field name
   * @returns void
   */
  onChangeFieldR(formgroup: any, field: any): void {
    this.setFormControlValue(formgroup, field, null);
    this.getFormControl(formgroup, field).clearValidators();
    this.getFormControl(formgroup, field).updateValueAndValidity();
  }

  /**
   * Add a FormControl (protnr) to the FormArray (protnrArray).
   * @param val - Value of new protnr. if not set, then set to empty string
   * @returns void
   */
  addProtnr(val: string = ''): void {
    this.getFormControl('section1', 'protnrArray').push(this.fb.group({protnr: [val, [Validators.required, Validators.pattern('^[\\d.\\-]{1,20}$'), CustomValidators.evprotnrAlreadyExistsValidator(this.evprotnrs, this.protocolId)]]}));
  }

  /**
   * Get formArray.
   * @param formgroup - Formgroup name
   * @param field - Field name
   * @returns FormArray - Returns the formArray
   */
  getFormArray(formgroup: any, field: any): FormArray {
    return this.getFormControl(formgroup, field) as FormArray;
  }

  /**
   * Delete a FormControl (protnr) at a given index from the FormArray (protnrArray).
   * @param index - Position to delete.
   * @returns void
   */
  deleteProtnr(index: any): void {
    this.getFormControl('section1', 'protnrArray').removeAt(index);
  }

  /**
   * Allow toggle radio buttons
   * @param formgroup - Formgroup name
   * @param field - Field name
   * @param event - Event
   * @param button - Radio button
   * @returns void
   */
  checkState(formgroup: any, field: any, event: any, button: any): void {
    event.preventDefault();
    this.getFormControl(formgroup, field).markAsTouched();
    if (this.getFormControlValue(formgroup, field) && this.getFormControlValue(formgroup, field) === button.value) {
      button.checked = false;
      this.setFormControlValue(formgroup, field, null);
    } else {
      this.setFormControlValue(formgroup, field, button.value);
      button.checked = true;
    }
  }

  /**
   * Save protocol on server.
   * @param type - Type of save (auto or '')
   * @returns void
   */
  save(type: string = ''): void {
    this.wvProtocol.markAllAsTouched();
    this.calculateCompletness();

    const valid = this.wvProtocol.value;
    for (const section of Object.keys(this.wvProtocol.controls)) {
      for (const field of Object.keys(this.getFormGroup(section).controls)) {
        if (field !== 'protnrArray' && this.getFormControl(section, field).valid) {
          valid[section][field] = this.getFormControlValue(section, field);
        } else if (field !== 'protnrArray') {
          valid[section][field] = '';
        }
      }
    }

    this.http.put<any>(MiddlewareURL + '/protocol/' + this.protocolId, {protocol: valid, amountMaxField: this.amount, amountField: this.amountRequired, valid: this.wvProtocol.valid, evprotnrs: this.evprotnrs}, {headers: hf.getHeader()}).subscribe(data => {
        // Get data, refresh accessToken and reset form.
        if (type === 'auto') {
          this.showStatus('check');
        } else {
          this.authService.setAccessToken(data);
          hf.successNotification(this.translate.instant('protocolPage.success.changed', {patid: this.getFormControlValue('section1', 'patid')}), this.translate, this.messageViewer);
          if (type === 'back') {
            this.back();
          }
        }
      },
      error => {
        // Handle error of http put request.
        if (type === 'auto') {
          this.showStatus('close');
        } else {
          hf.handleErrors(error, this.authService, this.translate, this.messageViewer, this.router);
        }
      });
  }

  /**
   * Save protocol every minute automatically.
   * @returns void
   */
  autoSave(): void {
    if (this.getAutoSaveSetting()) {
      const autoSave = setInterval(() => {
        if (!this.getAutoSaveSetting()) {
          clearInterval(autoSave);
        } else {
          this.save('auto');
        }
      }, 60000);
    }
  }

  /**
   * Get localStorage item autoSave
   * @returns boolean - if autoSave is set to false return false otherwise return true.
   */
  getAutoSaveSetting(): boolean {
    return localStorage.getItem('autoSave') !== 'false';
  }

  /**
   * Set localStorage item autoSave
   * @param autoSave - Toggle event
   * @returns void
   */
  setAutoSaveSetting(autoSave: any): void {
    localStorage.setItem('autoSave', autoSave.checked);
    this.autoSave();
  }

  /**
   * Set status of automatic save.
   * @param status - status of automatic save
   * @returns void
   */
  showStatus(status: string): void {
    this.autoSaveStatus = '';
    this.cRef.detectChanges();
    setTimeout(() => {
      this.autoSaveStatus = status;
      this.cRef.detectChanges();
    }, 10000);
  }

  /**
   * Calculate completness of wvProtocol form.
   * @returns void
   */
  calculateCompletness(): void {
    this.amountRequired = 0;
    this.amount = 0;
    for (const formgroup of Object.keys(this.wvProtocol.controls)) {
      for (const field of Object.keys(this.getFormGroup(formgroup).controls)) {
        if (this.isControlRequired(this.getFormControl(formgroup, field))) {
          this.amount++;
        }
        if (this.isControlRequired(this.getFormControl(formgroup, field)) && this.getFormControl(formgroup, field).valid) {
          this.amountRequired++;
        }
      }
    }
    const formArray = this.getFormArray('section1', 'protnrArray') as FormArray;
    for (const protnr of formArray.controls) {
      this.amount++;
      if (protnr.valid) {
        this.amountRequired++;
      }
    }
  }

  /**
   * Redirect to overview page.
   * @returns void.
   */
  back(): void {
    this.router.navigate(['/overview']);
  }

  /**
   * Get date of field datum.
   * @returns Moment - Return moment object of field datum
   */
  getDatumDate(): Moment {
    return moment(this.getFormControlValue('section1', 'datum'));
  }

  /**
   * Checks if fields of a specified tab (ER or ICU) are valid and returns a boolean value.
   * @returns boolean - Returns true if all sections are valid, otherwise false
   * @param section - Section to check validity (ER or ICU)
   */
  isValid(section: string): boolean {
    if (section === 'ER') {
      return (this.getFormGroup('section1').valid && this.getFormGroup('section2').valid && this.getFormGroup('section3').valid && this.getFormGroup('section3hyb').valid && this.getFormGroup('section4').valid && this.getFormGroup('section4hyb').valid && this.getFormGroup('section8hyb').valid);
    } else if (section === 'ICU') {
      return (this.getFormGroup('section3hyb').valid && this.getFormGroup('section4hyb').valid && this.getFormGroup('section5').valid && this.getFormGroup('section6').valid && this.getFormGroup('section7').valid && this.getFormGroup('section8').valid && this.getFormGroup('section8hyb').valid);
    } else {
      return false;
    }
  }

  /**
   * Handles enable and disable logic of standard checkboxes.
   * @returns void
   * @param checked - Check status of checkbox
   * @param formgroup - Formgroup name
   * @param field - Field name
   * @param max - Number of checkboxes
   * @param options - Maximum number of selectable checkboxes
   */
  onChangeStandardCheckbox(checked: boolean, formgroup: string, field: string, max: number, options: number): void {
    // If FormControlValue of field is max allowed selection minus 1 and checkbox is checked increase field FormControlValue by 1.
    if (this.getFormControlValue(formgroup, field) <= max - 1 && checked) {
      this.setFormControlValue(formgroup, field, this.getFormControlValue(formgroup, field) + 1);
      // If FormControlValue of field is max allowed selection and checkbox is unchecked decrease field FormControlValue by 1 and enable all other FormControls.
    } else if (this.getFormControlValue(formgroup, field) <= max && !checked) {
      this.setFormControlValue(formgroup, field, this.getFormControlValue(formgroup, field) - 1);
      for (let i = 1; i <= options; i++) {
        if (!this.getFormControlValue(formgroup, field + i)) {
          this.getFormControl(formgroup, field + i).enable();
        }
      }
    }
    // If FormControl of field is equal to max allowed selection disable all other FormControls.
    if (this.getFormControlValue(formgroup, field) === max) {
      for (let i = 1; i <= options; i++) {
        if (!this.getFormControlValue(formgroup, field + i)) {
          this.getFormControl(formgroup, field + i).disable();
        }
      }
    }
  }

  /**
   * Handles enable and disable logic of ekgaufn checkbox.
   * @returns void
   * @param checked - Check status of checkbox
   */
  onChangeEkgaufn(checked: boolean): void {
    this.ekgaufenCheck = true;
    // If ekgaufn1 is selected disable and set value of all other FormControls to null.
    if (this.getFormControlValue('section3', 'ekgaufn1')) {
      this.setFormControlValue('section3', 'ekgaufn', 1);
      for (let i = 2; i <= 14; i++) {
        this.getFormControl('section3', 'ekgaufn' + i).disable();
        this.setFormControlValue('section3', 'ekgaufn' + i, false);
      }
      // If ekgaufn14 is selected disable and set value of all other FormControls to null.
    } else if (this.getFormControlValue('section3', 'ekgaufn14')) {
      this.setFormControlValue('section3', 'ekgaufn', 1);
      for (let i = 1; i <= 13; i++) {
        this.getFormControl('section3', 'ekgaufn' + i).disable();
        this.setFormControlValue('section3', 'ekgaufn' + i, false);
      }
      // If ekgaufn8 is selected disable and set value of all other FormControls to null.
    } else if (this.getFormControlValue('section3', 'ekgaufn8')) {
      this.setFormControlValue('section3', 'ekgaufn', 1);
      for (let i = 1; i <= 14; i++) {
        if (i !== 8) {
          this.getFormControl('section3', 'ekgaufn' + i).disable();
          this.setFormControlValue('section3', 'ekgaufn' + i, false);
        }
      }
      // If ekgaufn9 is selected disable and set value of all other FormControls to null.
    } else if (this.getFormControlValue('section3', 'ekgaufn9')) {
      this.setFormControlValue('section3', 'ekgaufn', 1);
      for (let i = 1; i <= 14; i++) {
        if (i !== 9) {
          this.getFormControl('section3', 'ekgaufn' + i).disable();
          this.setFormControlValue('section3', 'ekgaufn' + i, false);
        }
      }
      // If ekgaufn10 is selected disable and set value of all other FormControls to null.
    } else if (this.getFormControlValue('section3', 'ekgaufn10')) {
      this.setFormControlValue('section3', 'ekgaufn', 1);
      for (let i = 1; i <= 14; i++) {
        if (i !== 10) {
          this.getFormControl('section3', 'ekgaufn' + i).disable();
          this.setFormControlValue('section3', 'ekgaufn' + i, false);
        }
      }
    } else {
      for (let i = 1; i <= 14; i++) {
        this.getFormControl('section3', 'ekgaufn' + i).enable();
      }
      // If FormControl ekgaufn is smaller or equal to 3 and checkbox is checked increase ekgaufn by 1.
      if (this.getFormControlValue('section3', 'ekgaufn') <= 3 && checked) {
        this.setFormControlValue('section3', 'ekgaufn', this.getFormControlValue('section3', 'ekgaufn') + 1);
        // If FormControl ekgaufn is smaller or equal to 3 and checkbox is unchecked decrease ekgaufn by 1 and enable all other FormControls.
      } else if (this.getFormControlValue('section3', 'ekgaufn') <= 3 && !checked) {
        this.setFormControlValue('section3', 'ekgaufn', this.getFormControlValue('section3', 'ekgaufn') - 1);
        for (let i = 1; i <= 14; i++) {
          if (!this.getFormControlValue('section3', 'ekgaufn' + i)) {
            this.getFormControlValue('section3', 'ekgaufn' + i).enable();
          }
        }
      }
      // If FormControl ekgaufn is equal to 3 disable all other FormControls.
      if (this.getFormControlValue('section3', 'ekgaufn') === 3) {
        for (let i = 1; i <= 14; i++) {
          if (!this.getFormControlValue('section3', 'ekgaufn' + i)) {
            this.getFormControl('section3', 'ekgaufn' + i).disable();
          }
        }
      }
    }
  }

  /**
   * Handles enable and disable logic of komplsek checkbox.
   * @returns void
   * @param checked - Check status of checkbox
   */
  onChangeKomplsek(checked: boolean): void {
    this.komplsekCheck = true;
    // If komplsek9 is selected disable and set value of all other FormControls to null.
    if (this.getFormControlValue('section8', 'komplsek9')) {
      this.setFormControlValue('section8', 'komplsek', 1);
      for (let i = 1; i <= 8; i++) {
        this.getFormControl('section8', 'komplsek' + i).disable();
        this.setFormControlValue('section8', 'komplsek' + i, false);
      }
      // If komplsek7 is selected disable and set value of all other FormControls to null.
    } else if (this.getFormControlValue('section8', 'komplsek7')) {
      this.setFormControlValue('section8', 'komplsek', 1);
      for (let i = 1; i <= 9; i++) {
        if (i !== 7) {
          this.getFormControl('section8', 'komplsek' + i).disable();
          this.setFormControlValue('section8', 'komplsek' + i, false);
        }
      }
    } else {
      // If FormControl komplsek is smaller or equal to 6 and checkbox is checked increase komplsek by 1.
      if (this.getFormControlValue('section8', 'komplsek') <= 6 && checked) {
        this.setFormControlValue('section8', 'komplsek', this.getFormControlValue('section8', 'komplsek') + 1);
        // If FormControl komplsek is smaller or equal to 7 and checkbox is unchecked decrease komplsek by 1 and enable all other FormControls.
      } else if (this.getFormControlValue('section8', 'komplsek') <= 7 && !checked) {
        this.setFormControlValue('section8', 'komplsek', this.getFormControlValue('section8', 'komplsek') - 1);
        for (let i = 1; i <= 9; i++) {
          if (!this.getFormControlValue('section8', 'komplsek' + i)) {
            this.getFormControl('section8', 'komplsek' + i).enable();
          }
        }
      }
      // If FormControl komplsek is equal to 3 disable all other FormControls.
      if (this.getFormControlValue('section8', 'komplsek') === 7) {
        for (let i = 1; i <= 9; i++) {
          if (!this.getFormControlValue('section8', 'komplsek' + i)) {
            this.getFormControl('section8', 'komplsek' + i).disable();
          }
        }
      }
    }
  }

  /**
   * Handles enable and disable logic of reaverl checkbox.
   * @returns void
   * @param checked - Check status of checkbox
   */
  onChangeReaverl(checked: boolean): void {
    // If reaverl8 is selected disable and set value of all other FormControls to null.
    if (this.getFormControlValue('section3hyb', 'reaverl8')) {
      this.setFormControlValue('section3hyb', 'reaverl', 1);
      for (let i = 1; i <= 7; i++) {
        this.getFormControl('section3hyb', 'reaverl' + i).disable();
        this.setFormControlValue('section3hyb', 'reaverl' + i, false);

      }
    } else {
      // If FormControl reaverl is smaller or equal to 8 and checkbox is checked increase reaverl by 1.
      if (this.getFormControlValue('section3hyb', 'reaverl') <= 8 && checked) {
        this.setFormControlValue('section3hyb', 'reaverl', this.getFormControlValue('section3hyb', 'reaverl') + 1);
        // If FormControl reaverl is smaller or equal to 8 and checkbox is unchecked decrease reaverl by 1 and enable all other FormControls.
      } else if (this.getFormControlValue('section3hyb', 'reaverl') <= 8 && !checked) {
        this.setFormControlValue('section3hyb', 'reaverl', this.getFormControlValue('section3hyb', 'reaverl') - 1);
        for (let i = 1; i <= 8; i++) {
          if (!this.getFormControlValue('section3hyb', 'reaverl' + i)) {
            this.getFormControl('section3hyb', 'reaverl' + i).enable();
          }
        }
      }
      // If FormControl reaverl is equal to 6 disable all other FormControls.
      if (this.getFormControlValue('section3hyb', 'reaverl') === 6) {
        for (let i = 1; i <= 8; i++) {
          if (!this.getFormControlValue('section3hyb', 'reaverl' + i)) {
            this.getFormControl('section3hyb', 'reaverl' + i).disable();
          }
        }
      }
    }
  }

  /**
   * Handles enable and disable logic of instab checkbox.
   * @returns void
   * @param checked - Check status of checkbox
   */
  onChangeInstab(checked: boolean): void {
    this.instabCheck = true;
    // If instab5 is selected disable and set value of all other FormControls to null.
    if (this.getFormControlValue('section4ICU', 'instab5')) {
      this.setFormControlValue('section4ICU', 'instab', this.getFormControlValue('section4ICU', 'instab') + 1);
      for (let i = 1; i <= 6; i++) {
        if (i !== 5) {
          this.getFormControl('section4ICU', 'instab' + i).disable();
          this.setFormControlValue('section4ICU', 'instab' + i, false);
        }
      }
    } else {
      // If FormControl instab is smaller or equal to 3 and checkbox is checked increase instab by 1.
      if (this.getFormControlValue('section4ICU', 'instab') <= 3 && checked) {
        this.setFormControlValue('section4ICU', 'instab', this.getFormControlValue('section4ICU', 'instab') + 1);
        // If FormControl instab is smaller or equal to 8 and checkbox is unchecked decrease instab by 1 and enable all other FormControls.
      } else if (this.getFormControlValue('section4ICU', 'instab') <= 4 && !checked) {
        this.setFormControlValue('section4ICU', 'instab', this.getFormControlValue('section4ICU', 'instab') - 1);
        for (let i = 1; i <= 6; i++) {
          if (!this.getFormControlValue('section4ICU', 'instab' + i)) {
            this.getFormControl('section4ICU', 'instab' + i).enable();
          }
        }
      }
      // If FormControl instab is equal to 4 disable all other FormControls.
      if (this.getFormControlValue('section4ICU', 'instab') === 4) {
        for (let i = 1; i <= 6; i++) {
          if (!this.getFormControlValue('section4ICU', 'instab' + i)) {
            this.getFormControl('section4ICU', 'instab' + i).disable();
          }
        }
      }
    }
  }

  /**
   * Handles enable and disable logic of ecprkompl checkbox.
   * @returns void
   * @param checked - Check status of checkbox
   */
  onChangeEcprkompl(checked: boolean): void {
    // If ecprkompl1 is selected disable and set value of all other FormControls to null.
    if (this.getFormControlValue('section5', 'ecprkompl1')) {
      this.setFormControlValue('section5', 'ecprkompl', 1);
      for (let i = 2; i <= 6; i++) {
        this.getFormControl('section5', 'ecprkompl' + i).disable();
        this.setFormControlValue('section5', 'ecprkompl' + i, false);
      }
      // If ecprkompl6 is selected disable and set value of all other FormControls to null.
    } else if (this.getFormControlValue('section5', 'ecprkompl6')) {
      this.setFormControlValue('section5', 'ecprkompl', 1);
      for (let i = 1; i <= 5; i++) {
        this.getFormControl('section5', 'ecprkompl' + i).disable();
        this.setFormControlValue('section5', 'ecprkompl' + i, false);
      }
    } else {
      // If FormControl ecprkompl is smaller or equal to 3 and checkbox is checked increase ecprkompl by 1.
      if (this.getFormControlValue('section5', 'ecprkompl') <= 3 && checked) {
        this.setFormControlValue('section5', 'ecprkompl', this.getFormControlValue('section5', 'ecprkompl') + 1);
        // If FormControl ecprkompl is smaller or equal to 4 and checkbox is unchecked decrease ecprkompl by 1 and enable all other FormControls.
      } else if (this.getFormControlValue('section5', 'ecprkompl') <= 4 && !checked) {
        this.setFormControlValue('section5', 'ecprkompl', this.getFormControlValue('section5', 'ecprkompl') - 1);
        for (let i = 1; i <= 6; i++) {
          if (!this.getFormControlValue('section5', 'ecprkompl' + i)) {
            this.getFormControl('section5', 'ecprkompl' + i).enable();
          }
        }
      }
      // If FormControl ecprkompl is equal to 4 disable all other FormControls.
      if (this.getFormControlValue('section5', 'ecprkompl') === 4) {
        for (let i = 1; i <= 6; i++) {
          if (!this.getFormControlValue('section5', 'ecprkompl' + i)) {
            this.getFormControl('section5', 'ecprkompl' + i).disable();
          }
        }
      }
    }
  }

  /**
   * Format Date.
   * @returns Moment | string - Returns a Moment object or a emty string
   * @param formgroup - Formgroup name
   * @param field - field name
   */
  formatDate(formgroup: any, field: any): Moment | string {
    return this.getFormControlValue(formgroup, field) ? moment(this.getFormControlValue(formgroup, field)).format('l') : '';
  }

  /**
   * Check if FormControl is required.
   * @param control - FormControl to check
   * @returns boolean - if the FormControl is required, true is returned otherwise false
   */
  isControlRequired(control: AbstractControl): boolean {
    if (!control) {
      return false;
    }
    if (control.validator) {
      const validator = control.validator({} as AbstractControl);
      if (validator && validator.required) {
        return true;
      }
    }
    return false;
  }

  /**
   * Change value on change field leb24h.
   * @returns void
   */
  onChangeLeb24h(): void {
    this.getFormControl('section8', 'icutage').clearValidators();
    this.getFormControl('section8', 'beatstd').clearValidators();
    if (this.getFormControlValue('section8hyb', 'leb24h') === '01') {
      for (const field of ['leb30d', 'lebentl', 'mrsentl', 'cpcentl', 'organexpl']) {
        this.getFormControl('section8', field).reset();
      }
      if (!['998', '999'].includes(this.getFormControlValue('section8', 'icutageR'))) {
        this.getFormControl('section8', 'icutage').setValidators([Validators.min(0), Validators.max(997)]);
      }
      if (!['998', '999'].includes(this.getFormControlValue('section8', 'icutageR'))) {
        this.getFormControl('section8', 'beatstd').setValidators([Validators.min(0), Validators.max(997)]);
      }
    } else if (this.getFormControlValue('section8hyb', 'leb24h') === '02') {
      this.setFormControlValue('section8', 'leb30d', '02');
      this.setFormControlValue('section8', 'lebentl', '02');
      this.setFormControlValue('section8', 'mrsentl', '06');
      if (!['998', '999'].includes(this.getFormControlValue('section8', 'icutageR'))) {
        this.getFormControl('section8', 'icutage').setValidators([Validators.min(0), Validators.max(2)]);
      }
      if (!['998', '999'].includes(this.getFormControlValue('section8', 'icutageR'))) {
        this.getFormControl('section8', 'beatstd').setValidators([Validators.min(0), Validators.max(25)]);
      }
      this.getFormControl('section8', 'organexpl').reset();
      this.getFormControl('section8', 'sf12').reset();
      this.getFormControl('section8', 'eq5d').reset();
      this.setFormControlValue('section8', 'cpcentl', '05');
    } else if (this.getFormControlValue('section8hyb', 'leb24h') === '99') {
      this.setFormControlValue('section8', 'leb30d', '99');
      this.setFormControlValue('section8', 'lebentl', '99');
      this.getFormControl('section8', 'mrsentl').reset();
      if (!['998', '999'].includes(this.getFormControlValue('section8', 'icutageR'))) {
        this.getFormControl('section8', 'icutage').setValidators([Validators.min(0), Validators.max(997)]);
      }
      if (!['998', '999'].includes(this.getFormControlValue('section8', 'icutageR'))) {
        this.getFormControl('section8', 'beatstd').setValidators([Validators.min(0), Validators.max(997)]);
      }
      this.getFormControl('section8', 'organexpl').reset();
      this.getFormControl('section8', 'sf12').reset();
      this.getFormControl('section8', 'eq5d').reset();
      this.setFormControlValue('section8', 'cpcentl', '99');
    } else {
      for (const field of ['leb30d', 'lebentl', 'mrsentl', 'cpcentl', 'eq5d', 'sf12']) {
        this.getFormControl('section8', field).reset();
      }
      if (!['998', '999'].includes(this.getFormControlValue('section8', 'icutageR'))) {
        this.getFormControl('section8', 'icutage').setValidators([Validators.min(0), Validators.max(997)]);
      }
      if (!['998', '999'].includes(this.getFormControlValue('section8', 'icutageR'))) {
        this.getFormControl('section8', 'beatstd').setValidators([Validators.min(0), Validators.max(997)]);
      }
    }
    this.getFormControl('section8', 'icutage').updateValueAndValidity();
    this.getFormControl('section8', 'beatstd').updateValueAndValidity();
  }

  /**
   * Change value on change field lebentl.
   * @returns void
   */
  onChangeLebent(): void {
    this.getFormControl('section8', 'cpcentl').clearValidators();
    this.getFormControl('section8', 'mrsentl').clearValidators();
    if (this.getFormControlValue('section8', 'lebentl') === '01') {
      this.getFormControl('section8', 'cpcentl').setValidators([Validators.required]);
      this.setFormControlValue('section8', 'organexpl', '02');
    } else if (this.getFormControlValue('section8', 'lebentl') === '02') {
      this.getFormControl('section8', 'cpcentl').reset();
      this.getFormControl('section8', 'mrsentl').reset();
      this.getFormControl('section8', 'organexpl').reset();
      this.getFormControl('section8', 'eq5d').reset();
      this.getFormControl('section8', 'sf12').reset();
    } else {
      for (const field of ['cpcentl', 'mrsentl', 'organexpl', 'eq5d', 'sf12']) {
        this.getFormControl('section8', field).reset();
      }
    }
  }

  /**
   * Clear validators of given fields.
   * @returns void
   * @param fields - Multidimensinal array with formgroup name and field name
   */
  onChangeFieldValueClear(fields: any[]): void {
    for (const field of fields) {
      this.getFormControl(field[0], field[1]).reset();
      this.getFormControl(field[0], field[1]).markAsUntouched();
      this.getFormControl(field[0], field[1]).clearValidators();
      this.getFormControl(field[0], field[1]).updateValueAndValidity();
    }
  }

  /**
   * Reset validators of given fields.
   * @returns void
   * @param fields - Multidimensinal array with formgroup name and field name
   */
  onChangeFieldValueSetValidators(fields: any[]): void {
    for (const field of fields) {
      this.resetValidators(field[0], field[1]);
    }
  }

  /**
   * On call hide rosc checkboxes.
   * @returns void
   */
  onChangeROSCAHideValues(): void {
    let counter = 0;
    if (this.getFormControlValue('section3', 'rosca') === '01') {
      if (this.getFormControlValue('section3', 'ekgaufn8')) {
        counter++;
      }
      if (this.getFormControlValue('section3', 'ekgaufn9')) {
        counter++;
      }
      if (this.getFormControlValue('section3', 'ekgaufn10')) {
        counter++;
      }
      this.setFormControlValue('section3', 'ekgaufn8', false);
      this.setFormControlValue('section3', 'ekgaufn9', false);
      this.setFormControlValue('section3', 'ekgaufn10', false);
      for (let i = 0; i < counter; i++) {
        this.onChangeEkgaufn(false);
      }
    }
  }

  /**
   * Clear checkboxes.
   * @returns void
   * @param formgroup - Formgroup name
   * @param field - field name
   */
  clearCheckboxes(formgroup: string, field: string): void {
    this.setFormControlValue(formgroup, field, 0);
    if (field === 'pcigefae' || field === 'ecprkompl') {
      for (let i = 1; i <= 6; i++) {
        this.setFormControlValue(formgroup, field + i, false);
        this.getFormControl(formgroup, field + i).enable();
      }
    }
    if (field === 'lyse_rosc') {
      for (let i = 1; i <= 3; i++) {
        this.setFormControlValue(formgroup, field + i, false);
        this.getFormControl(formgroup, field + i).enable();
      }
    }
    if (field === 'ecprven' || field === 'gthlimit') {
      for (let i = 1; i <= 5; i++) {
        this.setFormControlValue(formgroup, field + i, false);
        this.getFormControl(formgroup, field + i).enable();
      }
    }
    if (field === 'wvgrund') {
      for (let i = 1; i <= 8; i++) {
        this.setFormControlValue(formgroup, field + i, false);
        this.getFormControl(formgroup, field + i).enable();
      }
    }
  }

  /**
   * Reset validators of given field.
     * @returns void
   * @param formgroup - Formgroup name
   * @param field - field name
   */
  resetValidators(formgroup: string, field: string): void {
    if (['einsaort_cac', 'eoko', 'bewaufn', 'pci', 'pcierfolg', 'roscecpr', 'dauerkuehl', 'zieltemp1', 'ztod'].includes(field)) {
      this.getFormControl(formgroup, field).setValidators([Validators.required]);
    }
    if (['zroscaufn'].includes(field)) {
      if (!['99:99'].includes(this.getFormControlValue(formgroup, field + 'R'))) {
        this.getFormControl(formgroup, field).setValidators([Validators.required]);
      }
    }
    if (['ecprkompl'].includes(field)) {
      this.getFormControl(formgroup, field).setValidators([Validators.required, Validators.min(1), Validators.max(4)]);
    }
    if (['rraufn', 'rrdaufn', 'hfaufn'].includes(field)) {
      if (!['-1', '999'].includes(this.getFormControlValue(formgroup, field + 'R'))) {
        this.getFormControl(formgroup, field).setValidators([Validators.required, Validators.min(0), Validators.max(300)]);
      }
    }
    if (['hbaufn'].includes(field)) {
      if (!['-1', '99.9'].includes(this.getFormControlValue(formgroup, field + 'R'))) {
        if (this.getMeasUnitForField('hbaufn') === 'g/dl') {
          this.getFormControl(formgroup, field).setValidators([Validators.required, Validators.min(0.0), Validators.max(20.0)]);
        }
        if (this.getMeasUnitForField('hbaufn') === 'g/l') {
          this.getFormControl(formgroup, field).setValidators([Validators.required, Validators.min(0), Validators.max(200)]);
        }
      }
    }
    if (['phaufn'].includes(field)) {
      if (!['-1', '99.9'].includes(this.getFormControlValue(formgroup, field + 'R'))) {
        this.getFormControl(formgroup, field).setValidators([Validators.required, Validators.min(6.0), Validators.max(8.0)]);
      }
    }
    if (['ecprph'].includes(field)) {
      this.getFormControl(formgroup, field).setValidators([Validators.min(6.0), Validators.max(8.0)]);
    }
    if (['beaufn'].includes(field)) {
      if (!['-1', '99.9'].includes(this.getFormControlValue(formgroup, field + 'R'))) {
        this.getFormControl(formgroup, field).setValidators([Validators.required, Validators.min(-40.0), Validators.max(30.0)]);
      }
    }
    if (['ecprbe'].includes(field)) {
      this.getFormControl(formgroup, field).setValidators([Validators.min(-40.0), Validators.max(30.0)]);
    }
    if (['pco2aufn'].includes(field)) {
      if (!['-1', '999.9'].includes(this.getFormControlValue(formgroup, field + 'R'))) {
        this.getFormControl(formgroup, field).setValidators([Validators.required, Validators.min(3.8), Validators.max(300.0)]);
      }
    }
    if (['ecprpco2'].includes(field)) {
      if (this.getMeasUnitForField(field) === 'mmHg') {
        this.getFormControl(formgroup, field).setValidators([Validators.min(3.803), Validators.max(300.003)]);
      }
      if (this.getMeasUnitForField(field) === 'kPa') {
        this.getFormControl(formgroup, field).setValidators([Validators.min(0.507), Validators.max(39.997)]);
      }
    }
    if (field === 'adrena') {
      this.getFormControl(formgroup, field).setValidators([Validators.min(0.01), Validators.max(99.8)]);
    }
    if (field === 'amioda') {
      this.getFormControl(formgroup, field).setValidators([Validators.min(1), Validators.max(998)]);
    }
    if (field === 'afaufn') {
      this.getFormControl(formgroup, field).setValidators([Validators.min(0), Validators.max(50)]);
    }
    if (['o2saufn'].includes(field)) {
      this.getFormControl(formgroup, field).setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
    }
    if (['co2aufn'].includes(field)) {
      if (this.getMeasUnitForField(field) === 'mmHg') {
        this.getFormControl(formgroup, field).setValidators([Validators.min(0.000), Validators.max(80.002)]);
      }
      if (this.getMeasUnitForField(field) === 'kPa') {
        this.getFormControl(formgroup, field).setValidators([Validators.min(0.000), Validators.max(10.666)]);
      }
    }
    if (['ecprpao2'].includes(field)) {
      if (this.getMeasUnitForField(field) === 'mmHg') {
        this.getFormControl(formgroup, field).setValidators([Validators.min(0.000), Validators.max(500.000)]);
      }
      if (this.getMeasUnitForField(field) === 'kPa') {
        this.getFormControl(formgroup, field).setValidators([Validators.min(0.000), Validators.max(66.661)]);
      }
    }
    if (field === 'tempaufn') {
      this.getFormControl(formgroup, field).setValidators([Validators.min(20.0), Validators.max(40.0)]);
    }
    if (['lactaufn'].includes(field)) {
      if (this.getMeasUnitForField(field) === 'mg/dl') {
        this.getFormControl(formgroup, field).setValidators([Validators.required, Validators.min(0.90), Validators.max(270.03)]);
      }
      if (this.getMeasUnitForField(field) === 'mmol/l') {
        this.getFormControl(formgroup, field).setValidators([Validators.required, Validators.min(0.10), Validators.max(29.97)]);
      }
    }
    if (['ecprlact'].includes(field)) {
      if (this.getMeasUnitForField(field) === 'mg/dl') {
        this.getFormControl(formgroup, field).setValidators([Validators.min(0.90), Validators.max(270.03)]);
      }
      if (this.getMeasUnitForField(field) === 'mmol/l') {
        this.getFormControl(formgroup, field).setValidators([Validators.min(0.10), Validators.max(29.97)]);
      }
    }
    if (field === 'bzaufn') {
      if (this.getMeasUnitForField('bzaufn') === 'mg/dl') {
        this.getFormControl(formgroup, field).setValidators([Validators.required, Validators.min(0), Validators.max(600)]);
      }
      if (this.getMeasUnitForField('bzaufn') === 'mmol/l') {
        this.getFormControl(formgroup, field).setValidators([Validators.required, Validators.min(0), Validators.max(33.3)]);
      }
    }
    if (field === 'kreaaufn') {
      if (this.getMeasUnitForField('kreaaufn') === 'mg/dl') {
        this.getFormControl(formgroup, field).setValidators([Validators.required, Validators.min(0.2), Validators.max(5.7)]);
      }
      if (this.getMeasUnitForField('kreaaufn') === 'μmol/l') {
        this.getFormControl(formgroup, field).setValidators([Validators.required, Validators.min(17.7), Validators.max(503.9)]);
      }
    }
    if (['dekg12', 'dct', 'dcoro', 'dlyse', 'decls', 'diabp', 'dimpella'].includes(field)) {
      this.getFormControl(formgroup, field).setValidators([this.dateSmallerOrEqualToToday(), this.dateGreaterThanValidator('section1', 'adatum')]);
    }
    if (['zekg12', 'zct', 'zcoro', 'zlyse', 'zecls', 'ziabp', 'zimpella'].includes(field)) {
      this.getFormControl(formgroup, field).setValidators([this.timeGreaterThanValidator('section1', 'adatum', 'zadatum', formgroup, 'd' + field.substring(1))]);
    }
    if (['dkuehlbeg'].includes(field)) {
      this.getFormControl(formgroup, field).setValidators([Validators.required, this.dateSmallerOrEqualToToday(), this.dateGreaterThanValidator('section1', 'adatum')]);
    }
    if (['zkuehlbeg'].includes(field)) {
      this.getFormControl(formgroup, field).setValidators([Validators.required, this.timeGreaterThanValidator('section1', 'adatum', 'zadatum', formgroup, 'd' + field.substring(1))]);
    }
    if (['rrziel3'].includes(field)) {
      this.getFormControl(formgroup, field).setValidators([Validators.min(30), Validators.max(120)]);
    }
    if (['ecprdbk'].includes(field)) {
      this.getFormControl(formgroup, field).setValidators([Validators.required, this.dateSmallerOrEqualToToday, this.dateGreaterThanValidator('section1', 'datum')]);
    }
    if (['ecprdst'].includes(field)) {
      this.getFormControl(formgroup, field).setValidators([Validators.required, this.dateSmallerOrEqualToToday, this.dateGreaterThanValidator('section5', 'ecprdbk')]);
    }
    if (['ecprzst'].includes(field)) {
      this.getFormControl(formgroup, field).setValidators([this.timeGreaterThanValidator('section5', 'ecprdbk', 'ecprzbk', 'section5', 'ecprdst')]);
    }
    if (['ecprdend'].includes(field)) {
      this.getFormControl(formgroup, field).setValidators([Validators.required, this.dateSmallerOrEqualToToday, this.dateGreaterThanValidator('section5', 'ecprdst')]);
    }
    if (['ecprzend'].includes(field)) {
      this.getFormControl(formgroup, field).setValidators([this.timeGreaterThanValidator('section5', 'ecprdst', 'ecprzst', 'section5', 'ecprdend')]);
    }
    if (['dzieltemp'].includes(field)) {
      this.getFormControl(formgroup, field).setValidators([this.dateSmallerOrEqualToToday(), this.dateGreaterThanValidator('section6', 'dkuehlbeg')]);
    }
    if (['zzieltemp'].includes(field)) {
      this.getFormControl(formgroup, field).setValidators([this.timeGreaterThanValidator('section6', 'dkuehlbeg', 'zkuehlbeg', 'section6', 'dzieltemp')]);
    }
    if (['icutage'].includes(field)) {
      if (this.getFormControlValue('section8hyb', 'leb24h') === '02') {
        this.getFormControl(formgroup, field).setValidators([Validators.min(0), Validators.max(2)]);
      }
      if (this.getFormControlValue('section8hyb', 'leb24h') !== '02') {
        this.getFormControl(formgroup, field).setValidators([Validators.min(0), Validators.max(997)]);
      }
    }
    if (['beatstd'].includes(field)) {
      if (this.getFormControlValue('section8hyb', 'leb24h') === '02') {
        this.getFormControl(formgroup, field).setValidators([Validators.min(0), Validators.max(25)]);
      }
      if (this.getFormControlValue('section8hyb', 'leb24h') !== '02') {
        this.getFormControl(formgroup, field).setValidators([Validators.min(0), Validators.max(997)]);
      }
    }
    if (!['dzieltemp'].includes(field)) {
      this.getFormControl(formgroup, field).updateValueAndValidity();
    }
    if (['dtod'].includes(field)) {
      this.getFormControl(formgroup, field).setValidators([Validators.required, this.dateSmallerOrEqualToToday(), this.dateGreaterThanValidator('section1', 'adatum')]);
    }
    if (['vdatum'].includes(field)) {
      this.getFormControl(formgroup, field).setValidators([this.dateSmallerOrEqualToToday(), this.dateGreaterThanValidator('section1', 'adatum')]);
    }
    if (['entldat'].includes(field)) {
      this.getFormControl(formgroup, field).setValidators([Validators.required, this.dateSmallerOrEqualToToday, this.dateGreaterThanValidator('section1', 'adatum')]);
    }
    if (['eq5d'].includes(field)) {
      this.getFormControl(formgroup, field).setValidators([Validators.min(11111), Validators.max(55555)]);
    }
    if (['sf12'].includes(field)) {
      this.getFormControl(formgroup, field).setValidators([Validators.min(0), Validators.max(100)]);
    }
    this.getFormControl(formgroup, field).markAsDirty();
    this.getFormControl(formgroup, field).markAsTouched();
  }

  /**
   * get protocol data and set input values.
     * @returns void
   */
  loadValue(): void {
    if (this.protocolId) {
      // Get protocol.
      this.http.get<any>(MiddlewareURL + '/protocol/' + this.protocolId, {headers: hf.getHeader()}).subscribe(data => {
          // Set accessToken.
          this.authService.setAccessToken(data);
          for (const [key, value] of Object.entries(data.protocol[0])) {
            // Set value of fields.
            if (key === 'datum' && value !== '') {
              this.setFormControlValue('section1', key, moment(value as string, 'YYYY-MM-DD'));
            }
            if (['gebdat', 'adatum'].includes(key)) {
              if (value === '1000-01-01') {
                this.setFormControlValue('section1', key + 'R', value);
                this.onChangeFieldR('section1', key);
              } else if (value !== '') {
                this.setFormControlValue('section1', key, moment(value as string, 'YYYY-MM-DD'));
                this.getFormControl('section1', key).markAsTouched();
              }
            }
            if (['zadatum', 'stokenn', 'namklin', 'iknumklin', 'patid', 'geschl', 'aufnq', 'zkuebgp'].includes(key)) {
              this.setFormControlValue('section1', key, value);
            }

            if (['ekg1', 'urkrstst', 'einsaort_cac', 'eoko', 'eokc', 'zckb', 'zkoll', 'zchdm', 'zhdm', 'rosc', 'zrosc1', 'pes', 'autocpr'].includes(key)) {
              this.setFormControlValue('section2', key, value);
            }
            if (['adrena'].includes(key)) {
              if (['-1', '00.0', '99.9'].includes(value as string)) {
                this.setFormControlValue('section2', key + 'R', value);
                this.onChangeFieldR('section2', key);
              } else {
                this.setFormControlValue('section2', key, value);
                this.onChangeField('section2', key);
              }
            }
            if (['amioda'].includes(key)) {
              if (['-1', '0', '999'].includes(value as string)) {
                this.setFormControlValue('section2', key + 'R', value);
                this.onChangeFieldR('section2', key);
              } else {
                this.setFormControlValue('section2', key, value);
                this.onChangeField('section2', key);
              }
            }
            if (['bewaufn', 'rosca', 'beataufn', 'urkrststaufn', 'bnpaufn', 'tropart', 'bgaaufn', 'troponw', 'tropaaufn', 'tropaufn', 'trop2aaufn', 'trop2aufn'].includes(key)) {
              this.setFormControlValue('section3', key, value);
            }
            if (['rraufn', 'rrdaufn', 'hfaufn', 'o2saufn'].includes(key)) {
              if (['-1', '999'].includes(value as string)) {
                this.setFormControlValue('section3', key + 'R', value);
                this.onChangeFieldR('section3', key);
              } else {
                this.setFormControlValue('section3', key, value);
                this.onChangeField('section3', key);
              }
            }
            if (['afaufn'].includes(key)) {
              if (['-1'].includes(value as string)) {
                this.setFormControlValue('section3', key + 'R', value);
                this.onChangeFieldR('section3', key);
              } else {
                this.setFormControlValue('section3', key, value);
                this.onChangeField('section3', key);
              }
            }
            if (['co2aufn'].includes(key)) {
              if (['-1'].includes(value as string)) {
                this.setFormControlValue('section3', key + 'R', value);
                this.onChangeFieldR('section3', key);
              } else if (value !== '') {
                let co2aufnValue = 0;
                if (this.getMeasUnitForField(key) === 'kPa') {
                  co2aufnValue = parseFloat(value as string) * 0.133322;
                } else {
                  co2aufnValue = parseFloat(value as string);
                }
                this.setFormControlValue('section3', key, co2aufnValue.toFixed(3));
                this.onChangeField('section3', key);
              } else {
                this.setFormControlValue('section3', key, value);
                this.onChangeField('section3', key);
              }
            }
            if (['tempaufn'].includes(key)) {
              if (['99.9'].includes(value as string)) {
                this.setFormControlValue('section3', key + 'R', value);
                this.onChangeFieldR('section3', key);
              } else {
                this.setFormControlValue('section3', key, value);
                this.onChangeField('section3', key);
              }
            }
            if (['phaufn', 'beaufn'].includes(key)) {
              if (['99.9', '-1'].includes(value as string)) {
                this.setFormControlValue('section3', key + 'R', value);
                this.onChangeFieldR('section3', key);
              } else if (value !== '') {
                this.setFormControlValue('section3', key, value);
                this.onChangeField('section3', key);
              }
            }
            if (['hbaufn'].includes(key)) {
              if (['99.9', '-1'].includes(value as string)) {
                this.setFormControlValue('section3', key + 'R', value);
                this.onChangeFieldR('section3', key);
              } else if (value !== '') {
                let hbaufnValue = 0;
                if (this.getMeasUnitForField(key) === 'g/l') {
                  hbaufnValue = parseFloat(value as string) * 10;
                  this.setFormControlValue('section3', key, hbaufnValue.toFixed(0));
                } else {
                  hbaufnValue = parseFloat(value as string);
                  this.setFormControlValue('section3', key, hbaufnValue.toFixed(1));
                }
                this.onChangeField('section3', key);
              }
            }
            if (['pco2aufn'].includes(key)) {
              if (['999.9', '-1'].includes(value as string)) {
                this.setFormControlValue('section3', key + 'R', value);
                this.onChangeFieldR('section3', key);
              } else if (value !== '') {
                this.setFormControlValue('section3', key, value);
                this.onChangeField('section3', key);
              }
            }
            if (['bzaufn'].includes(key)) {
              if (['999'].includes(value as string)) {
                this.setFormControlValue('section3', key + 'R', value);
                this.onChangeFieldR('section3', key);
              } else if (value !== '') {
                let bzaufnValue = 0;
                if (this.getMeasUnitForField(key) === 'mmol/l') {
                  bzaufnValue = parseFloat(value as string) * 0.0555;
                  this.setFormControlValue('section3', key, bzaufnValue.toFixed(1));
                } else {
                  bzaufnValue = parseFloat(value as string);
                  this.setFormControlValue('section3', key, bzaufnValue.toFixed(0));
                }
                this.onChangeField('section3', key);
              } else {
                this.setFormControlValue('section3', key, value);
                this.onChangeField('section3', key);
              }
            }
            if (['lactaufn'].includes(key)) {
              if (['999'].includes(value as string)) {
                this.setFormControlValue('section3', key + 'R', value);
                this.onChangeFieldR('section3', key);
              } else if (value !== '') {
                let lactaufnValue = 0;
                if (this.getMeasUnitForField(key) === 'mmol/l') {
                  lactaufnValue = parseFloat(value as string) * 0.111;
                } else {
                  lactaufnValue = parseFloat(value as string);
                }
                this.setFormControlValue('section3', key, lactaufnValue.toFixed(2));
                this.onChangeField('section3', key);
              } else {
                this.setFormControlValue('section3', key, value);
                this.onChangeField('section3', key);
              }
            }
            if (['kreaaufn'].includes(key)) {
              if (['999.9'].includes(value as string)) {
                this.setFormControlValue('section3', key + 'R', value);
                this.onChangeFieldR('section3', key);
              } else if (value !== '') {
                let kreaaufnValue = 0;
                if (this.getMeasUnitForField(key) === 'μmol/l') {
                  kreaaufnValue = parseFloat(value as string) * 88.40168421052632;
                  this.setFormControlValue('section3', key, kreaaufnValue.toFixed(1));
                } else {
                  kreaaufnValue = parseFloat(value as string);
                  this.setFormControlValue('section3', key, kreaaufnValue.toFixed(3));
                }

                this.onChangeField('section3', key);
              } else {
                this.setFormControlValue('section3', key, value);
                this.onChangeField('section3', key);
              }
            }
            if (['zroscaufn'].includes(key)) {
              if (['99:99'].includes(value as string)) {
                this.setFormControlValue('section3', key + 'R', value);
                this.onChangeFieldR('section3', key);
              } else if (value !== '') {
                this.setFormControlValue('section3', key, value);
                this.onChangeField('section3', key);
              }
            }
            if (['ekg12', 'zekg12', 'ekg12auf', 'stemi', 'efast', 'ct', 'zct', 'coro', 'zcoro', 'coro_cpr', 'ncoro_grund', 'ecls', 'zecls', 'geniabp', 'ziabp', 'genimpella', 'zimpella', 'acb', 'genpacerwv', 'epu', 'bzziel2'].includes(key)) {
              this.setFormControlValue('section4', key, value);
            }
            if (['dekg12', 'dct', 'dcoro', 'decls', 'diabp', 'dimpella'].includes(key) && value !== '') {
              this.setFormControlValue('section4', key, moment(value as string, 'YYYY-MM-DD'));
            }
            if (['rrziel3'].includes(key)) {
              if (['-1', '999'].includes(value as string)) {
                this.setFormControlValue('section4', key + 'R', value);
                this.onChangeFieldR('section4', key);
              } else {
                this.setFormControlValue('section4', key, value);
                this.onChangeField('section4', key);
              }
            }
            if (['tee', 'tte', 'pci', 'pcierfolg', 'lyse', 'zlyse'].includes(key)) {
              this.setFormControlValue('section4hyb', key, value);
            }
            if (['dlyse'].includes(key) && value !== '') {
              this.setFormControlValue('section4hyb', key, moment(value as string, 'YYYY-MM-DD'));
            }
            if (['ecprzbk', 'ecprzst', 'ecprph', 'ecprbe', 'ecprpunkt', 'ecprart', 'ecprbein', 'ecprvav', 'roscecpr', 'ecprende', 'ecprzend', 'eclsiabp', 'impellaecls'].includes(key)) {
              this.setFormControlValue('section5', key, value);
            }
            if (['ecprdbk', 'ecprdst', 'ecprdend'].includes(key) && value !== '') {
              this.setFormControlValue('section5', key, moment(value as string, 'YYYY-MM-DD'));
            }
            if (['ecprlact'].includes(key)) {
              if (value !== '') {
                let lactaufnValue = 0;
                if (this.getMeasUnitForField(key) === 'mmol/l') {
                  lactaufnValue = parseFloat(value as string) * 0.111;
                } else {
                  lactaufnValue = parseFloat(value as string);
                }
                this.setFormControlValue('section5', key, lactaufnValue.toFixed(2));
              } else {
                this.setFormControlValue('section5', key, value);
              }
            }
            if (['ecprpco2'].includes(key)) {
              if (value !== '') {
                let ecprpco2Value = 0;
                if (this.getMeasUnitForField(key) === 'kPa') {
                  ecprpco2Value = parseFloat(value as string) * 0.133322;
                } else {
                  ecprpco2Value = parseFloat(value as string);
                }
                this.setFormControlValue('section5', key, ecprpco2Value.toFixed(3));
              } else {
                this.setFormControlValue('section5', key, value);
              }
            }
            if (['ecprpao2'].includes(key)) {
              if (value !== '') {
                let ecprpao2Value = 0;
                if (this.getMeasUnitForField(key) === 'kPa') {
                  ecprpao2Value = parseFloat(value as string) * 0.133322;
                } else {
                  ecprpao2Value = parseFloat(value as string);
                }
                this.setFormControlValue('section5', key, ecprpao2Value.toFixed(3));
              } else {
                this.setFormControlValue('section5', key, value);
              }
            }
            if (['aktkuehl', 'naktkuehl_grund', 'kuehlbeg', 'dauerkuehl', 'zieltemp1', 'zzieltemp', 'kuehlrel', 'fieb', 'fiebrpae'].includes(key)) {
              this.setFormControlValue('section6', key, value);
            }
            if (['dkuehlbeg'].includes(key)) {
              if (value === '9999-99-99') {
                this.setFormControlValue('section6', key + 'R', value);
                this.onChangeFieldR('section6', key);
              } else if (value !== '') {
                this.onChangeField('section6', key);
                this.setFormControlValue('section6', key, moment(value as string, 'YYYY-MM-DD'));
              }
            }
            if (['zkuehlbeg'].includes(key)) {
              if (value === '99:99') {
                this.setFormControlValue('section6', key + 'R', value);
                this.onChangeFieldR('section6', key);
              } else if (value !== '') {
                this.setFormControlValue('section6', key, value);
                this.onChangeField('section6', key);
              }
            }
            if (['dzieltemp'].includes(key) && value !== '') {
              this.setFormControlValue('section6', key, moment(value as string, 'YYYY-MM-DD'));
            }
            if (['ssep', 'nse', 'eegwv', 'cct', 'cmrt', 'neuro'].includes(key)) {
              this.setFormControlValue('section7', key, value);
            }
            if (['leb30d', 'icdimpl', 'lebentl', 'thlimit', 'organexpl', 'wvwie', 'zvdatum', 'cpcentl', 'mrsentl', 'cpcvor', 'mrsvor', 'lebensqual1', 'eq5d', 'sf12'].includes(key)) {
              this.setFormControlValue('section8', key, value);
            }
            if (['entldat'].includes(key)) {
              if (value === '9999-99-99') {
                this.setFormControlValue('section8', key + 'R', value);
                this.onChangeFieldR('section8', key);
              } else if (value !== '') {
                this.setFormControlValue('section8', key, moment(value as string, 'YYYY-MM-DD'));
                this.onChangeField('section8', key);
              } else {
                this.onChangeField('section8', key);
              }
            }
            if (['icutage', 'beatstd'].includes(key)) {
              if (['999', '998'].includes(value as string)) {
                this.setFormControlValue('section8', key + 'R', value);
                this.onChangeFieldR('section8', key);
              } else {
                this.setFormControlValue('section8', key, value);
                this.onChangeField('section8', key);
              }
            }
            if (['vdatum'].includes(key) && value !== '') {
              this.setFormControlValue('section8', key, moment(value as string, 'YYYY-MM-DD'));
            }
            if (['leb24h'].includes(key)) {
              this.setFormControlValue('section8hyb', key, value);
            }
            if (['dtod'].includes(key)) {
              if (value === '9999-99-99') {
                this.setFormControlValue('section8hyb', key + 'R', value);
                this.onChangeFieldR('section8hyb', key);
              } else if (value !== '') {
                this.setFormControlValue('section8hyb', key, moment(value as string, 'YYYY-MM-DD'));
                this.getFormControl('section8hyb', key).markAsTouched();
              }
            }
            if (['ztod'].includes(key)) {
              if (['99:99'].includes(value as string)) {
                this.setFormControlValue('section8hyb', key + 'R', value);
                this.onChangeFieldR('section8hyb', key);
              } else {
                this.setFormControlValue('section8hyb', key, value);
                this.onChangeField('section8hyb', key);
              }
            }
          }
          this.deleteProtnr(0);
          let counter = 0;
          for (let i = 1; i <= 5; i++) {
            if (data.protocol[0]['protnr_0' + i]) {
              this.addProtnr(data.protocol[0]['protnr_0' + i]);
              counter++;
            }
          }
          if (counter === 0) {
            this.addProtnr();
          }
          // Set checkboxes.
          this.setCheckboxValue('section3', 'ekgaufn', data.protocol[0], ['00', '01', '02', '03', '04', '05', '06', '09', '10', '11', '12', '13', '98', '99']);
          this.setCheckboxValue('section3hyb', 'reaverl', data.protocol[0], ['02', '03', '04', '05', '06', '07', '08', '10']);
          this.setCheckboxValue('section4', 'hitshits', data.protocol[0], ['01', '02', '03', '04', '05', '06', '07', '08', '98']);
          this.setCheckboxValue('section4ICU', 'instab', data.protocol[0], ['01', '02', '03', '04', '97', '98']);
          this.setCheckboxValue('section4hyb', 'pcigefae', data.protocol[0], ['01', '02', '03', '04', '98']);
          this.setCheckboxValue('section4hyb', 'lyse_rosc', data.protocol[0], ['01', '02', '03']);
          this.setCheckboxValue('section5', 'ecprven', data.protocol[0], ['01', '02', '03', '04', '98']);
          this.setCheckboxValue('section5', 'ecprkompl', data.protocol[0], ['01', '02', '03', '04', '98', '99']);
          this.setCheckboxValue('section8', 'komplsek', data.protocol[0], ['02', '03', '04', '05', '08', '09', '97', '98', '99']);
          this.setCheckboxValue('section8', 'gthlimit', data.protocol[0], ['01', '02', '03', '04', '98']);
          this.setCheckboxValue('section8', 'wvgrund', data.protocol[0], ['01', '02', '03', '04', '05', '06', '07', '98']);
          // Set validators.
          if (['02', '03', '04', '98'].includes(this.getFormControlValue('section3', 'rosca'))) {
            this.onChangeFieldValueSetValidators([['section3', 'zroscaufn']]);
          }
          if (this.getFormControlValue('section3', 'bgaaufn') !== '00' && this.getFormControlValue('section3', 'bgaaufn')) {
            this.onChangeFieldValueSetValidators([['section3', 'hbaufn'], ['section3', 'beaufn'], ['section3', 'phaufn'], ['section3', 'pco2aufn']]);
          }
          if (this.getFormControlValue('section1', 'aufnq') === '01') {
            this.onChangeFieldValueSetValidators([['section2', 'einsaort_cac']]);
          }
          if (this.getFormControlValue('section1', 'aufnq') === '02') {
            this.onChangeFieldValueSetValidators([['section2', 'eoko']]);
          }
          if (this.getFormControlValue('section3', 'rosca') === '01') {
            this.onChangeFieldValueSetValidators([['section3', 'bewaufn']]);
          } else {

            this.onChangeFieldValueClear([['section3', 'rraufn'], ['section3', 'rrdaufn'], ['section3', 'hfaufn']]);
          }
          if (this.getFormControlValue('section4', 'coro') === '01') {
            this.onChangeFieldValueSetValidators([['section4hyb', 'pci']]);
          }
          if (this.getFormControlValue('section4hyb', 'pci') === '01') {
            this.onChangeFieldValueSetValidators([['section4hyb', 'pcierfolg']]);
          }
          if (this.getFormControlValue('section4', 'ecls') === '02') {
            this.onChangeFieldValueSetValidators([['section5', 'ecprdbk'], ['section5', 'ecprzbk'], ['section5', 'ecprdst'], ['section5', 'ecprzst'], ['section5', 'ecprlact'], ['section5', 'ecprph'], ['section5', 'ecprbe'], ['section5', 'ecprpco2'], ['section5', 'ecprpao2'], ['section5', 'ecprpunkt'], ['section5', 'ecprart'], ['section5', 'ecprven'], ['section5', 'ecprbein'], ['section5', 'ecprvav'], ['section5', 'roscecpr'], ['section5', 'ecprende'], ['section5', 'ecprkompl'], ['section5', 'ecprdend'], ['section5', 'ecprzend'], ['section5', 'eclsiabp'], ['section5', 'impellaecls']]);
          }
          if (this.getFormControlValue('section6', 'aktkuehl') === '01') {
            this.onChangeFieldValueSetValidators([['section6', 'zieltemp1'], ['section6', 'dauerkuehl'], ['section6', 'dkuehlbeg'], ['section6', 'zkuehlbeg'], ['section6', 'dzieltemp'], ['section6', 'zzieltemp']]);
          }
          if (this.getFormControlValue('section8', 'wvwie') === '01') {
            this.onChangeFieldValueSetValidators([['section8', 'vdatum'], ['section8', 'zvdatum']]);
          }
          this.wvProtocol.markAllAsTouched();
          this.isLoaded = true;
        },
        error => {
          // Handle error of http get request.
          hf.handleErrors(error, this.authService, this.translate, this.messageViewer, this.router);
        }
      );
    }
  }

  /**
   * Set checkbox value.
   * @returns void
   * @param formgroup - Formgroup name
   * @param field - Field name
   * @param data - Protocol data
   * @param checkboxes - array of possible checkboxes
   */
  setCheckboxValue(formgroup: string, field: string, data: any, checkboxes: string[]): void {
    let check = 1;
    for (const checkbox of checkboxes) {
      if (data[field + '___' + checkbox] === '1') {
        this.setFormControlValue(formgroup, field + check, true);
        if (field === 'ekgaufn') {
          this.onChangeEkgaufn(true);
        } else if (field === 'reaverl') {
          this.onChangeReaverl(true);
        } else if (field === 'hits') {
          this.onChangeStandardCheckbox(true, formgroup, field, 8, 9);
        } else if (field === 'instab') {
          this.onChangeInstab(true);
        } else if (field === 'pcigefae') {
          this.onChangeStandardCheckbox(true, formgroup, field, 4, 5);
        } else if (field === 'lyse_rosc') {
          this.onChangeStandardCheckbox(true, formgroup, field, 2, 3);
        } else if (field === 'ecprven') {
          this.onChangeStandardCheckbox(true, formgroup, field, 2, 5);
        } else if (field === 'ecprkompl') {
          this.onChangeEcprkompl(true);
        } else if (field === 'komplsek') {
          this.onChangeKomplsek(true);
        } else if (field === 'gthlimit') {
          this.onChangeStandardCheckbox(true, formgroup, field, 3, 5);
        } else if (field === 'wvgrund') {
          this.onChangeStandardCheckbox(true, formgroup, field, 6, 8);
        }
      }
      check++;
    }
  }

  /**
   * Input check with Regular Expressions.
   * @returns void
   * @param $event - Event
   * @param regex - Regular Expressions to check
   */
  preventRegex($event: any, regex: string): void {
    const pattern = new RegExp(regex);
    if (!pattern.test($event.key)) {
      $event.preventDefault();
    }
  }

}

