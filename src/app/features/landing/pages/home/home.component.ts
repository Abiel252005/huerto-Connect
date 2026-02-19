import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from '../../components/hero/hero.component';
import { AboutComponent } from '../../components/about/about.component';
import { FeaturesComponent } from '../../components/features/features.component';
import { ProcessComponent } from '../../components/process/process.component';
import { StatsComponent } from '../../components/stats/stats.component';
import { TestimonialsComponent } from '../../components/testimonials/testimonials.component';
import { FaqComponent } from '../../components/faq/faq.component';
import { ContactComponent } from '../../components/contact/contact.component';
import { HeaderComponent } from '../../../../core/components/header/header.component';
import { FooterComponent } from '../../../../core/components/footer/footer.component';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [
        CommonModule,
        HeroComponent,
        AboutComponent,
        FeaturesComponent,
        ProcessComponent,
        StatsComponent,
        TestimonialsComponent,
        FaqComponent,
        ContactComponent,
        HeaderComponent,
        FooterComponent
    ],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent {

}
