import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, Testimonial } from '../../../../core/services/data.service';

@Component({
    selector: 'app-testimonials',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './testimonials.component.html',
    styleUrls: ['./testimonials.component.scss']
})
export class TestimonialsComponent implements OnInit {
    testimonials: Testimonial[] = [];

    constructor(private dataService: DataService) { }

    ngOnInit(): void {
        this.dataService.getTestimonials().subscribe(data => {
            this.testimonials = data;
        });
    }
}
