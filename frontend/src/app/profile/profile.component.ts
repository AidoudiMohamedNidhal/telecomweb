import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  loading = true;

  constructor() {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    // Mock data - will be replaced with API call
    setTimeout(() => {
      this.loading = false;
    }, 1000);
  }
}
