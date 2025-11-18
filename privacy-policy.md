# Politica de confidențialitate

## Jokes & Quotes — Fun Extension

Această politică descrie ce face extensia, ce permisiuni folosește și cum sunt tratate datele și preferințele utilizatorilor.

### Descrierea extensiei
Jokes & Quotes afișează bancuri, citate motivaționale și meme în popup. La cerere (sau automat la interval configurat) extensia injectează în pagina curentă o animație Lottie („Baby Camel") care trage un chenar cu text (banc sau citat). Animația este livrată din pachetul local al extensiei și nu necesită server extern.

### Ce date sunt colectate și stocate
- Extensia NU colectează date personale despre utilizatori.
- Nu trimitem date către servere externe.
- Se salvează local, în `chrome.storage`, doar preferințele utilizatorului: de exemplu `autoPlay` on/off, `autoMinutes` (intervalul), și `autoType` (alegerea între "joke" sau "quote").
- Resursele afișate (jocuri/citate/meme, animație) sunt servite din pachetul local `data/` și `assets/` (fișiere JSON, PNG, SVG) folosind `chrome.runtime.getURL()`.

Toate datele menționate mai sus rămân pe dispozitivul dvs. și nu sunt partajate cu terți.

### Permisiuni folosite și justificări

- `activeTab` — Folosită pentru a permite rularea animației sau a modifica temporar DOM-ul paginii active atunci când utilizatorul apasă `Play on screen`. Aceasta este folosită numai pentru pagini HTTP(S) obișnuite; extensia nu injectează în pagini interne ale browserului (ex. `chrome://`, Magazinul Chrome).

- `scripting` — Permite injectarea controlată a fișierelor locale (ex.: `src/lottie.min.js`, `src/injector.js`) și apelarea funcției care pornește animația în `window` (MAIN world). Aceasta este necesară pentru a afișa animația și elementele vizuale în pagina utilizatorului.

- `storage` — Pentru salvarea preferințelor utilizatorului (auto‑play on/off, interval, tipul de conținut). Datele stocate sunt mici (setări) și nu conțin informații personale.

- `alarms` — Pentru programarea automată a animațiilor la intervalul setat de utilizator (auto‑play). Nu este folosit pentru colectare de date.

- `host_permissions` (`<all_urls>`) — Permite injectarea pe pagini HTTP(S) obișnuite; aceasta nu acordă acces la paginile interne ale browserului sau la paginile magazinului de extensii care sunt protejate de browser.

### Cod extern și resurse
- Extensia folosește biblioteci incluse local în pachet (`src/lottie.min.js`) și fișiere de animație JSON (`assets/Baby Camel.json`). Nu se încarcă bibliotecă remote dintr-un CDN în versiunea curentă.

### Securitate
- Toate elementele injectate (containerul animației, overlay-ul de blur etc.) sunt eliminate automat după terminarea animației.
- Nu stocăm parole, cookie-uri sau alte informații sensibile.
- Se folosesc bune practici pentru a minimiza interferența cu pagina gazdă (z-index ridicat pentru vizibilitate, pointer-events controlat, eliminare curată la finalizare).

### Situații când animația nu pornește
- Pe unele pagini speciale (ex.: `chrome://`, Web Store, vizualizatoare PDF integrate sau iframe-uri cross-origin) browserul refuză injecția de script — în aceste cazuri extensia va afișa un mesaj informativ în popup.

### Confidențialitate & partajare
- Nu colectăm, nu stocăm și nu partajăm date personale cu terțe părți.
- Statisticile de utilizare sau orice tip de telemetrie nu sunt colectate în această versiune.

### Contact și suport
Pentru întrebări, erori sau preocupări legate de confidențialitate, deschide o problemă pe repository-ul proiectului: https://github.com/Botoaca-Florentina-Veronica/chrome-extension

### Actualizări ale politicii
Această politică poate fi actualizată ocazional. Data ultimei actualizări: **2025-11-18**.

---

Jokes & Quotes — O extensie mică pentru a aduce un zâmbet în browsing-ul tău. Felicitări pentru instalare și mulțumim pentru feedback!