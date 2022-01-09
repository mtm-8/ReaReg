import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {RoleGuardService as RoleGuard} from './service/role-guard/role-guard.service';
import {SettingsComponent} from './page/settings/settings.component';
import {LoginComponent} from './page/login/login.component';
import {OverviewComponent} from './page/overview/overview.component';
import {ImportComponent} from './page/import/import.component';
import {UserComponent} from './page/user/user.component';
import {ProtocolComponent} from './page/protocol/protocol.component';
import {ExportComponent} from './page/export/export.component';
import {AdministrationComponent} from './page/administration/administration.component';
import {AddComponent} from './page/administration/user/add/add.component';
import {EditComponent} from './page/administration/user/edit/edit.component';
import {AuthorizationComponent} from './component/authorization/authorization.component';
import {PageNotFoundComponent} from './component/page-not-found/page-not-found.component';
import {LegalComponent} from './page/legal/legal.component';

const routes: Routes = [
  // Redirect default route to login.
  {path: '', redirectTo: 'login', pathMatch: 'full'},
  // Urls with no AuthGuard.
  {path: 'login', component: LoginComponent},
  {path: 'legal', component: LegalComponent},
  {path: 'no-auth', component: AuthorizationComponent},
  // Urls with authentication and  authorization level >= 1 [data collector].
  {path: 'settings', component: SettingsComponent, canActivate: [RoleGuard], data: {role: 1}},
  {path: 'overview', component: OverviewComponent, canActivate: [RoleGuard], data: {role: 1}},
  {path: 'user', component: UserComponent, canActivate: [RoleGuard], data: {role: 1}},
  {path: 'protocol', component: ProtocolComponent, canActivate: [RoleGuard], data: {role: 1}},
  // Urls with authentication and authorization level >= 2 [data manager].
  {path: 'import', component: ImportComponent, canActivate: [RoleGuard], data: {role: 2}},
  {path: 'export', component: ExportComponent, canActivate: [RoleGuard], data: {role: 2}},
  // Urls with authentication and authorization level 3 [admin].
  {path: 'administration', component: AdministrationComponent, canActivate: [RoleGuard], data: {role: 3}},
  {path: 'addUser', component: AddComponent, canActivate: [RoleGuard], data: {role: 3}},
  {path: 'editUser', component: EditComponent, canActivate: [RoleGuard], data: {role: 3}},
  // Wildcard url.
  {path: '**', component: PageNotFoundComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
