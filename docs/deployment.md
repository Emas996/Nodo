# Pubblicazione su Cloudflare Pages

## Stato e accessi

Il repository contiene un sito statico pronto per la build. Questa guida descrive i passaggi da eseguire nell'account Cloudflare e non certifica un deployment avvenuto. Per collegare il sito occorrono accesso al repository GitHub `Emas996/Nodo` e all'account Cloudflare che gestisce `designedbynodo.com`.

Prima di creare o modificare un progetto, controllare i progetti Pages esistenti e la configurazione DNS del dominio. Se esiste già il progetto corretto, riutilizzarlo. Conservare i record estranei al sito, inclusi quelli di posta e verifica dei servizi.

## Collegamento GitHub e build

In Cloudflare, aprire **Workers & Pages**, creare un progetto **Pages** con integrazione Git e autorizzare l'accesso al repository esistente. Usare questi valori:

| Impostazione | Valore |
| --- | --- |
| Repository | `Emas996/Nodo` |
| Ramo di produzione | `main` |
| Framework preset | `None` |
| Directory radice | Radice del repository |
| Comando di build | `npm run build` |
| Directory di output | `dist` |
| Variabile di ambiente | `NODE_VERSION=22` |

Il progetto contiene anche `.nvmrc` con versione `22`. Non sono necessarie chiavi, segreti o variabili pubbliche dell'applicazione. Dopo il collegamento, verificare nelle impostazioni del progetto che i deployment automatici del ramo `main` siano abilitati.

Riferimenti: [integrazione Git](https://developers.cloudflare.com/pages/configuration/git-integration/), [configurazione build](https://developers.cloudflare.com/pages/configuration/build-configuration/), [versioni dell'ambiente di build](https://developers.cloudflare.com/pages/configuration/build-image/).

## Dominio e HTTPS

1. Attendere che il primo deployment abbia stato positivo e controllare l'URL `pages.dev` assegnato dal progetto.
2. Nel progetto Pages aprire **Custom domains → Set up a domain** e inserire `designedbynodo.com`.
3. Esaminare gli eventuali record DNS richiesti da Cloudflare. Risolvere solo i conflitti relativi al sito; non sovrascrivere record estranei.
4. Attendere che il dominio risulti attivo e verificare che il certificato HTTPS sia valido aprendo il sito nel browser.
5. Controllare l'eventuale comportamento di `www.designedbynodo.com`. Se deve reindirizzare al dominio principale, configurare il redirect nel proprio account mantenendo percorso e query string.

Associare prima il dominio al progetto Pages: un record DNS isolato non completa l'associazione. Il dominio canonico nei metadati e nella sitemap è `https://designedbynodo.com`. [Domini personalizzati](https://developers.cloudflare.com/pages/configuration/custom-domains/), [redirect da www](https://developers.cloudflare.com/pages/how-to/www-redirect/).

## Verifica finale

Controllare sia sull'URL di anteprima sia sul dominio ufficiale:

- `/`, `/products` e `/about` rispondono correttamente, anche aprendo direttamente l'indirizzo.
- Un percorso inesistente restituisce il codice HTTP `404` e la pagina dedicata.
- Fotografie, font, favicon e stylesheet si caricano senza errori.
- Tutti i collegamenti Etsy aprono il negozio in una nuova scheda.
- I menu e i contenuti funzionano su telefono e desktop, con tastiera e movimento ridotto.
- Le tre pagine dichiarano il dominio canonico corretto; `robots.txt` e `sitemap.xml` sono raggiungibili.
- Una nuova modifica su `main` avvia un deployment automatico.

Cloudflare Pages pubblica i file `products.html` e `about.html` ai percorsi senza estensione. Il file `404.html` evita il fallback da applicazione a pagina singola: un percorso inesistente rimane un errore 404. [Gestione delle pagine e degli URL](https://developers.cloudflare.com/pages/configuration/serving-pages/).

Le intestazioni in `public/_headers` vengono copiate nella build. Non è necessario aggiungere regole DNS, redirect globali o configurazioni di cache al repository per generare il sito.
