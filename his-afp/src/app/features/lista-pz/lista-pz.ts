import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TabellaPz } from '../../pattern/tabella-pz/tabella-pz';
import { Button } from 'primeng/button';

@Component({
  selector: 'his-lista-pz',
  imports: [TabellaPz, Button, RouterLink],
  templateUrl: './lista-pz.html',
  styleUrl: './lista-pz.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaPz {}
