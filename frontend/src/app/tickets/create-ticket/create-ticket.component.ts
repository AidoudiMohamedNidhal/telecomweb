import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-create-ticket',
  templateUrl: './create-ticket.component.html',
  styleUrls: ['./create-ticket.component.scss']
})
export class CreateTicketComponent implements OnInit {
  ticketForm: FormGroup;
  loading = false;
  categories = ['ADSL', 'FIBRE', 'MOBILE', 'BILLING', 'OTHER'];
  priorities = ['LOW', 'MEDIUM', 'HIGH'];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.ticketForm = this.fb.group({
      subject: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      category: ['', Validators.required],
      priority: ['MEDIUM', Validators.required],
      region: [''],
      contactPhone: ['']
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.ticketForm.invalid) {
      return;
    }

    this.loading = true;

    // Mock API call - will be replaced with actual API
    setTimeout(() => {
      this.snackBar.open('Ticket created successfully!', 'Close', {
        duration: 3000
      });
      this.router.navigate(['/tickets']);
    }, 1500);
  }

  get subject() { return this.ticketForm.get('subject'); }
  get description() { return this.ticketForm.get('description'); }
  get category() { return this.ticketForm.get('category'); }
  get priority() { return this.ticketForm.get('priority'); }
  get region() { return this.ticketForm.get('region'); }
  get contactPhone() { return this.ticketForm.get('contactPhone'); }
}
