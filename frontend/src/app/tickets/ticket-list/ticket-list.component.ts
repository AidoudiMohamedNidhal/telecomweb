import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface Ticket {
  id: number;
  code: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  region?: string;
  created_at: string;
  created_by_name: string;
  assigned_to_name?: string;
}

@Component({
  selector: 'app-ticket-list',
  templateUrl: './ticket-list.component.html',
  styleUrls: ['./ticket-list.component.scss']
})
export class TicketListComponent implements OnInit {
  displayedColumns: string[] = ['code', 'subject', 'category', 'priority', 'status', 'created_at', 'actions'];
  dataSource = new MatTableDataSource<Ticket>();
  loading = true;

  constructor(
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    // Mock data for now - will be replaced with API call
    setTimeout(() => {
      this.dataSource.data = [
        {
          id: 1,
          code: 'TT-20260122-0001',
          subject: 'Internet connection down',
          category: 'FIBRE',
          priority: 'HIGH',
          status: 'NEW',
          region: 'Tataouine',
          created_at: '2026-01-22T10:00:00Z',
          created_by_name: 'John Doe'
        }
      ];
      this.loading = false;
    }, 1000);
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  viewTicket(ticket: Ticket): void {
    this.router.navigate(['/tickets', ticket.id]);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'NEW': return 'accent';
      case 'ASSIGNED': return 'primary';
      case 'IN_PROGRESS': return 'warn';
      case 'RESOLVED': return 'primary';
      case 'CLOSED': return '';
      default: return '';
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'HIGH': return 'warn';
      case 'MEDIUM': return 'accent';
      case 'LOW': return 'primary';
      default: return '';
    }
  }
}
