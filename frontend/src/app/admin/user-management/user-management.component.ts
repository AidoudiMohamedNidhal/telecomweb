import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  loading = true;

  constructor() {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    // Mock data - will be replaced with API call
    setTimeout(() => {
      this.loading = false;
    }, 1000);
  }
}
