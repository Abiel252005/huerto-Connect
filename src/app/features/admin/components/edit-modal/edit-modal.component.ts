import {
    CUSTOM_ELEMENTS_SCHEMA,
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface EditField {
    key: string;
    label: string;
    type: 'text' | 'email' | 'number' | 'select' | 'checkbox';
    options?: string[];
    required?: boolean;
    placeholder?: string;
}

@Component({
    selector: 'app-edit-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './edit-modal.component.html',
    styleUrls: ['./edit-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditModalComponent {
    @Input() visible = false;
    @Input() title = 'Editar registro';
    @Input() fields: EditField[] = [];
    @Input() set data(value: Record<string, unknown> | null) {
        this.formData = value ? { ...value } : {};
    }
    @Output() save = new EventEmitter<Record<string, unknown>>();
    @Output() cancel = new EventEmitter<void>();

    formData: Record<string, unknown> = {};

    onOverlayClick(event: MouseEvent) {
        if ((event.target as HTMLElement).classList.contains('overlay')) {
            this.cancel.emit();
        }
    }

    onSave() {
        this.save.emit({ ...this.formData });
    }

    trackByKey(_: number, field: EditField): string {
        return field.key;
    }
}
