# Nōdo — Official Brand Website

Sito ufficiale del progetto di design Nōdo: tre pagine in inglese, fotografie dei prodotti reali e acquisto tramite Etsy. Il catalogo iniziale comprende i due prodotti approvati: fermalibri con portasegnalibri e organizer rotante.

## Sviluppo locale

È sufficiente Node.js 22 o successivo. Non ci sono dipendenze da installare.

```sh
npm run dev
```

Aprire `http://127.0.0.1:4173`. Il server genera il sito all'avvio; dopo una modifica ai sorgenti, arrestarlo e riavviarlo. Per usare una porta diversa: `PORT=4174 npm run dev`.

```sh
npm run build
npm run check
```

La build produce la cartella `dist/`. Il controllo ricostruisce il sito e verifica struttura HTML, metadati, destinazioni locali, fotografie, link Etsy e corrispondenza dei due prodotti fra homepage e catalogo.

## Struttura

| Percorso | Contenuto |
| --- | --- |
| `src/render.mjs` | Pagine, componenti condivisi e metadati |
| `src/data/products.mjs` | Dati riutilizzabili dei prodotti |
| `public/` | Immagini, stile, interazioni, favicon, sitemap e intestazioni |
| `scripts/` | Build, anteprima locale e controlli senza dipendenze |
| `docs/deployment.md` | Configurazione e verifiche per Cloudflare Pages |
| `dist/` | Risultato generato, escluso da Git |

Per aggiungere, rimuovere o aggiornare un prodotto, modificare le voci in `src/data/products.mjs` e aggiungere le fotografie in `public/images/`. Per ciascuna immagine servono le varianti `-640.webp`, `-1200.webp` e `-1588.webp`, con proporzioni 4:3. Home e Products riutilizzano gli stessi dati; i controlli si adattano al numero di voci. Mantenere almeno un prodotto: il primo è mostrato anche nella hero. Usare fotografie originali e testo alternativo descrittivo. La fotografia editoriale di About è indipendente dal catalogo. Le font sono di sistema: nessuna richiesta esterna a servizi di font.

## Pagine e acquisti

- `/`: presentazione del marchio e prodotti selezionati.
- `/products`: catalogo con gli stessi due prodotti.
- `/about`: filosofia del progetto.

Non sono presenti carrello, pagamento o pagine prodotto interne. I pulsanti di acquisto aprono il negozio Etsy in una nuova scheda.

## Pubblicazione

Repository: [Emas996/Nodo](https://github.com/Emas996/Nodo). Dominio previsto: [designedbynodo.com](https://designedbynodo.com).

Cloudflare Pages: ramo `main`, comando `npm run build`, cartella di output `dist`, versione Node `22`. Consultare [la guida di pubblicazione](docs/deployment.md) per collegamento GitHub, dominio e verifiche.

Il codice è predisposto per Cloudflare Pages. La presenza di questa configurazione non attesta che il collegamento all'account, il dominio o il deployment siano già stati completati e verificati.
