import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-ticket-detail',
  templateUrl: './ticket-detail.component.html',
  styleUrls: ['./ticket-detail.component.scss']
})
export class TicketDetailComponent implements OnInit {
  ticketId: number;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.ticketId = +this.route.snapshot.paramMap.get('id')!;
  }

  ngOnInit(): void {
    this.loadTicket();
  }

  loadTicket(): void {
    // Mock data - will be replaced with API call
    setTimeout(() => {
      this.loading = false;
    }, 1000);
  }
}
