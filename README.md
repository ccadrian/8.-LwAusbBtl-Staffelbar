# Staffelbar · Bestandsverwaltung

Ein einzelnes HTML-Tool für die Getränke-Bestandsverwaltung einer Bar.
Läuft auf GitHub Pages, speichert im Hintergrund in Firebase Firestore und ist
ohne Anmeldung direkt per QR-Code nutzbar.

**Alles steckt in `index.html`** – kein Build, keine Abhängigkeiten, kein Server.

---

## Was das Tool kann

| Bereich | Funktion |
|---|---|
| **Zählen** | Alle Getränke als große Tap-Flächen, Zahlenblock fürs schnelle Zählen im Stehen. Jede Zählung wird mit Datum/Uhrzeit als neuer Eintrag gespeichert – **nichts wird überschrieben**. |
| **Nachkauf** | Lieferungen separat erfassen, damit der Verbrauch korrekt bleibt (ein Nachkauf ist kein Verbrauch). |
| **Statistik** | Verbrauch zwischen zwei Zählungen, Ranking der beliebtesten Getränke, Verlaufsdiagramm pro Getränk, Filter nach Kategorie und Zeitraum. |
| **Vorhersage** | Ø-Verbrauch pro Tag/Woche und Hochrechnung, wann ein Getränk leer ist – **nur wenn die Datenlage das hergibt** (siehe unten). |
| **Erinnerung** | „Bald nachkaufen“ steht ganz oben auf der Startseite, sortiert nach Dringlichkeit. |
| **Verwalten** | Getränke anlegen, bearbeiten, löschen; Export als CSV und JSON; JSON-Backup einspielen. |
| **QR-Code** | Wird im Tool selbst erzeugt (keine externe Bibliothek) und zeigt auf die eigene GitHub-Pages-URL. Direkt ausdruckbar für den Tresen. |

---

## Einrichtung in 3 Schritten

### 1. Firebase-Projekt anlegen

1. [console.firebase.google.com](https://console.firebase.google.com) → **Projekt hinzufügen**
2. **Firestore-Datenbank** → *Datenbank erstellen* → Modus egal, die Regeln kommen in Schritt 2
3. **Projektübersicht → Web-App hinzufügen** (`</>`-Symbol), Namen vergeben
4. Firebase zeigt einen `firebaseConfig`-Block – diese Werte werden gleich gebraucht

### 2. Zugriffsregeln setzen

Das Tool arbeitet **ohne Login**. Damit das funktioniert, muss Firestore
Schreibzugriff auf genau diesen Datenraum erlauben – in der Firebase-Konsole
unter *Firestore → Regeln*:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bars/staffelbar/{coll}/{doc} {
      allow read, write: if true;
    }
  }
}
```

> **Wichtig:** Diese Regeln erlauben jedem, der die Projekt-ID kennt, Lesen und
> Schreiben in diesem Pfad – das ist der Preis für „kein Login“. Nur `bars/staffelbar/…`
> ist freigegeben, der Rest des Projekts bleibt gesperrt. Wer das enger fassen
> will, nutzt Firebase App Check oder anonyme Anmeldung. Die exakten Regeln für
> die eigene Bar-ID zeigt das Tool unter **Mehr → Datenbank**.

### 3. Konfiguration eintragen

**Variante A – fest in die Datei** (empfohlen, dann läuft es auf jedem Gerät sofort):
In `index.html` ganz oben den Block `FIREBASE_CONFIG` ausfüllen:

```js
const FIREBASE_CONFIG = {
  apiKey: "AIza…",
  authDomain: "meinprojekt.firebaseapp.com",
  projectId: "meinprojekt",
  storageBucket: "meinprojekt.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

**Variante B – im Tool**: Tab **Mehr → Datenbank**, den `firebaseConfig`-Block
einfügen und speichern. Gilt dann nur für dieses eine Gerät (praktisch zum Testen).

### GitHub Pages aktivieren

Repository → **Settings → Pages → Source: Deploy from a branch** → Branch `main`,
Ordner `/ (root)`. Nach ein bis zwei Minuten liegt das Tool unter
`https://<benutzername>.github.io/<repository>/`.

Diese URL im Tool unter **Mehr** als QR-Code ausdrucken und an den Tresen hängen.

---

## Wie der Verbrauch berechnet wird

Zwischen zwei Zählungen gilt:

```
Verbrauch = Bestand(alt) + Nachkäufe dazwischen − Bestand(neu)
```

Deshalb müssen Lieferungen als **Nachkauf** erfasst werden – sonst sieht es aus,
als wäre weniger verbraucht worden. Steigt der Bestand ohne erfassten Nachkauf,
markiert das Tool den Abschnitt und lässt ihn aus dem Durchschnitt heraus,
statt die Zahlen stillschweigend zu verfälschen.

## Wann *keine* Vorhersage angezeigt wird

Eine Hochrechnung erscheint nur, wenn sie belastbar ist. Sonst steht dort der
Grund statt einer geratenen Zahl:

| Bedingung | Sonst |
|---|---|
| mindestens **2 Verbrauchsabschnitte** (= 3 Zählungen) | „Zu wenige Zählungen für eine belastbare Vorhersage“ |
| Abschnitte decken zusammen mindestens **2 Tage** ab | „Zeitraum der Zählungen zu kurz“ |
| überhaupt gemessener Verbrauch | „Bisher kein Verbrauch gemessen“ |
| Streuung der Tagesverbräuche **≤ 75 %** des Mittelwerts | „Verbrauch schwankt zu stark für eine sinnvolle Vorhersage“ |

Ist alles erfüllt, gilt: `Ø pro Tag = Verbrauch gesamt ÷ Tage gesamt`, und daraus
`Reichweite = Bestand ÷ Ø pro Tag`. Ein Getränk landet in der
Nachkauf-Erinnerung, wenn die Reichweite unter der eingestellten Warnschwelle
liegt (Standard 7 Tage) oder der Mindestbestand unterschritten ist.

---

## Gut zu wissen

- **Offline**: Firestore puffert lokal. Zählungen am Tresen funktionieren auch
  bei schlechtem WLAN und gehen raus, sobald wieder Netz da ist. Der Punkt oben
  rechts zeigt den Status (grün = synchron, gelb = offline, rot = Fehler).
- **Ohne Firebase-Konfiguration** läuft das Tool im lokalen Modus: Daten bleiben
  im Browser des Geräts und werden nicht geteilt. Zum Ausprobieren reicht das.
- **Mehrere Bars** in einem Firebase-Projekt: `?bar=zweite-bar` an die URL hängen.
  Jeder Datenraum braucht eine eigene Regel-Zeile (siehe oben).
- **Backup**: Tab **Mehr → Export**. Das JSON lässt sich dort auch wieder
  einspielen.

## Technisch

- Eine Datei, ~2.000 Zeilen: HTML + CSS + JavaScript, keine Frameworks
- Firebase Web SDK v10 wird zur Laufzeit als ES-Modul von `gstatic.com` geladen
- Diagramme sind handgeschriebenes SVG, der QR-Code-Encoder (Byte-Modus,
  Fehlerkorrektur M, Version 1–10) ebenfalls – dadurch keine externen Skripte
  außer dem Firebase-SDK
