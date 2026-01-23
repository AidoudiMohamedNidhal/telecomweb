import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  loading = true;
  stats = {
    totalTickets: 0,
    newTickets: 0,
    resolvedTickets: 0,
    users: 0
  };

  constructor() {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    // Mock data - will be replaced with API call
    setTimeout(() => {
      this.stats = {
        totalTickets: 150,
        newTickets: 25,
        resolvedTickets: 100,
        users: 50
      };
      this.loading = false;
    }, 1000);
  }
}
