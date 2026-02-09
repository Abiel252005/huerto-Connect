import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, FAQ } from '../../../../core/services/data.service';

@Component({
    selector: 'app-faq',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './faq.component.html',
    styleUrls: ['./faq.component.scss']
})
export class FaqComponent implements OnInit {
    faqs: FAQ[] = [];

    constructor(private dataService: DataService) { }

    ngOnInit(): void {
        this.dataService.getFAQs().subscribe(data => {
            this.faqs = data;
        });
    }

    toggle(index: number): void {
        // Accordion behavior - close others when one opens
        this.faqs.forEach((faq, i) => {
            if (i !== index) faq.open = false;
        });
        this.faqs[index].open = !this.faqs[index].open;
    }
}
