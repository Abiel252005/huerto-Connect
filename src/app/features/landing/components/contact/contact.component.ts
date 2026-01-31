import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from '../../../../core/services/data.service';

@Component({
    selector: 'app-contact',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './contact.component.html',
    styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
    contactForm: FormGroup;
    isSubmitting = false;
    isSuccess = false;

    constructor(private fb: FormBuilder, private dataService: DataService) {
        this.contactForm = this.fb.group({
            name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phone: [''],
            message: ['', Validators.required]
        });
    }

    onSubmit() {
        if (this.contactForm.valid) {
            this.isSubmitting = true;

            this.dataService.sendContactForm(this.contactForm.value).subscribe({
                next: (success) => {
                    this.isSubmitting = false;
                    if (success) {
                        this.isSuccess = true;
                        this.contactForm.reset();
                        setTimeout(() => this.isSuccess = false, 5000);
                    }
                },
                error: (err) => {
                    console.error('Error sending form', err);
                    this.isSubmitting = false;
                }
            });
        } else {
            this.contactForm.markAllAsTouched();
        }
    }
}
