import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

// Auth Components
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';

// Ticket Components
import { TicketListComponent } from './tickets/ticket-list/ticket-list.component';
import { TicketDetailComponent } from './tickets/ticket-detail/ticket-detail.component';
import { CreateTicketComponent } from './tickets/create-ticket/create-ticket.component';

// Admin Components
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { UserManagementComponent } from './admin/user-management/user-management.component';

// Main Components
import { HomeComponent } from './home/home.component';
import { ProfileComponent } from './profile/profile.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  // Protected routes
  { 
    path: 'tickets', 
    component: TicketListComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'tickets/create', 
    component: CreateTicketComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'tickets/:id', 
    component: TicketDetailComponent,
    canActivate: [AuthGuard]
  },
  
  // Admin only routes
  { 
    path: 'admin/dashboard', 
    component: DashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] }
  },
  { 
    path: 'admin/users', 
    component: UserManagementComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] }
  },
  
  // Profile
  { 
    path: 'profile', 
    component: ProfileComponent,
    canActivate: [AuthGuard]
  },
  
  // Fallback
  { path: '**', redirectTo: '/home' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
