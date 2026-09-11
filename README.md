# Staffelbar · Bestandsverwaltung

Ein einzelnes HTML-Tool für die Getränke-Bestandsverwaltung einer Bar.
Läuft auf GitHub Pages, speichert im Hintergrund in Firebase Firestore und ist
ohne Anmeldung direkt per QR-Code nutzbar.

**Alles steckt in `index.html`** – kein Build, keine Abhängigkeiten, kein Server.

| Datei | Zweck |
|---|---|
| `index.html` | das komplette Tool |
| `setup.mjs` | richtet Firebase automatisch ein (ein Befehl) |
| `firestore.rules` | Zugriffsregeln |
| `firebase.json` | Projektdatei für das Deployment der Regeln |
| `.github/workflows/pages.yml` | veröffentlicht die Seite bei jedem Push |

---

## Was das Tool kann

| Bereich | Funktion |
|---|---|
| **Zählrunde** | Geführt, ein Getränk nach dem anderen, nach Kategorie sortiert, mit Fortschrittsanzeige. Der Zahlenblock steht direkt darunter – kein Suchen in langen Listen. Überspringen ist erlaubt, die Übersicht zeigt jederzeit, was schon gezählt ist und was fehlt. |
| **Kästen** | Pro Getränk lässt sich eine Gebindegröße hinterlegen (1 Kasten = 20 Flaschen). Gezählt wird dann in **Kästen + einzelne Flaschen**, das Tool rechnet um. Gespeichert und gerechnet wird immer in Einzelflaschen. |
| **Zusammenfassung** | Direkt nach dem Speichern: was sich verändert hat, was verbraucht wurde, wo der Bestand gestiegen ist – ohne selbst zu rechnen. |
| **Einkaufsliste** | Füllt sich von selbst aus Warnschwelle und Vorhersage, mit Mengenvorschlag in vollen Kästen. Eigene Positionen (auch freie Notizen wie „Eis“) lassen sich ergänzen. Abhaken bucht den Kauf als Nachkauf – die Position verschwindet dadurch von allein. |
| **Nachkauf** | Lieferungen separat erfassen, damit der Verbrauch korrekt bleibt (ein Nachkauf ist kein Verbrauch). |
| **Statistik** | Verbrauch zwischen zwei Zählungen, Ranking der beliebtesten Getränke, Verlaufsdiagramm pro Getränk, Filter nach Kategorie und Zeitraum. Mengen wahlweise einzeln oder in Gebinden. |
| **Vorhersage** | Ø-Verbrauch pro Tag/Woche und Hochrechnung, wann ein Getränk leer ist – **nur wenn die Datenlage das hergibt** (siehe unten). |
| **Erinnerung** | „Bald nachkaufen“ steht ganz oben auf der Startseite, sortiert nach Dringlichkeit. |
| **Verwalten** | Getränke anlegen, bearbeiten, löschen; Export als CSV und JSON; JSON-Backup einspielen. |
| **QR-Code** | Wird im Tool selbst erzeugt (keine externe Bibliothek) und zeigt auf die eigene GitHub-Pages-URL. Direkt ausdruckbar für den Tresen. |

---

## Einrichtung

> **Bereits erledigt.** Firebase-Projekt `lwausbbtl-39ae4`, Firestore (eur3) und
> die Zugriffsregeln stehen, die Konfiguration ist in `index.html` eingetragen
> und GitHub Pages ist aktiv:
> **<https://ccadrian.github.io/8.-LwAusbBtl-Staffelbar/>**
>
> Die Schritte unten braucht nur, wer das Tool für eine *weitere* Bar in einem
> eigenen Firebase-Projekt aufsetzen will.

### Der schnelle Weg: ein Befehl

Auf dem eigenen Rechner im Projektordner:

```bash
node setup.mjs
```

Das Skript erledigt alles Weitere selbst:

1. Google-Anmeldung (öffnet einmal den Browser – der einzige Handgriff)
2. Firebase-Projekt anlegen oder ein vorhandenes auswählen
3. Firestore-Datenbank erstellen
4. Web-App registrieren und die Konfiguration abholen
5. Konfiguration in `index.html` eintragen
6. Zugriffsregeln aus `firestore.rules` veröffentlichen
7. Änderung committen und pushen

Voraussetzung ist Node 18+ und ein eingerichtetes `git`. Sonst nichts –
`firebase-tools` wird über `npx` geholt und muss nicht installiert werden.

### GitHub Pages

**Einmalig nötig** (zwei Klicks, danach nie wieder):

> Repository → **Settings** → **Pages** → *Build and deployment* → **Source: GitHub Actions**

Den Token, mit dem der Workflow läuft, lässt GitHub Pages nicht selbst anlegen –
diesen einen Schalter muss ein Repository-Administrator umlegen. Danach
veröffentlicht `.github/workflows/pages.yml` die Seite bei jedem Push von allein.

Läuft der Workflow, bevor der Schalter umgelegt ist, bricht er mit genau diesem
Hinweis ab. Danach einfach neu starten: **Actions → Deploy to GitHub Pages →
Run workflow**. Die fertige Adresse steht anschließend im Lauf-Protokoll und
unter Settings → Pages.

### Von Hand, falls gewünscht

<details>
<summary>Aufklappen</summary>

1. [console.firebase.google.com](https://console.firebase.google.com) → Projekt anlegen
2. **Firestore-Datenbank** → Datenbank erstellen
3. **Web-App hinzufügen** (`</>`), `firebaseConfig` kopieren
4. Werte oben in `index.html` in den Block `FIREBASE_CONFIG` eintragen –
   oder im Tool unter **Mehr → Datenbank** einfügen (gilt dann nur für dieses Gerät)
5. Regeln aus `firestore.rules` in der Konsole unter *Firestore → Regeln* einfügen

</details>

Die Daten liegen unter `bars/<bar-id>/…` in vier Sammlungen: `drinks`
(mit `packSize`/`packName` fürs Gebinde), `counts`, `purchases` und `shopping`
(die Einkaufsliste). `qty` ist in allen Fällen die Menge in Einzeleinheiten.

> **Zur Sicherheit:** Ohne Login müssen die Regeln offen sein – wer die
> Projekt-ID kennt, kann in `bars/staffelbar/…` lesen und schreiben. Alles
> außerhalb dieses Pfads ist gesperrt. Wer es enger braucht, nutzt Firebase
> App Check oder anonyme Anmeldung.

---

## Kästen und Einzelflaschen

Eine Regel für alles: **gerechnet und gespeichert wird immer in Einzeleinheiten**
(Flasche, Dose, Glas). Kästen sind reine Ein- und Ausgabe – beim Zählen werden
sie sofort umgerechnet, angezeigt werden sie wieder als Kästen, sofern das
eingeschaltet ist (*Mehr → Einstellungen*, oder der Umschalter in der Statistik).

Das hat einen Grund: Ändert sich später die Gebindegröße, bleiben alte Zahlen
trotzdem vergleichbar, und Getränke mit und ohne Kasten lassen sich in derselben
Statistik nebeneinander stellen. Ein Getränk ohne Gebindeangabe verhält sich
genau wie vorher.

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
- **Kein Zoom-Gezappel**: Auf dem Telefon vergrößert sich die Seite beim
  schnellen Tippen nicht mehr. Dafür sorgen `touch-action: manipulation`
  (schaltet den Doppeltipp-Zoom ab) und Eingabefelder mit mindestens 16px
  (darunter zoomt iOS Safari beim Fokus von selbst). Aufziehen mit zwei
  Fingern bleibt möglich.

## Design

Monochrom – schwarz, weiß, Grauabstufungen, keine Akzentfarbe. Hairline-Rahmen,
Systemschrift, viel Weißraum. Hell und Dunkel folgen automatisch der
Systemeinstellung des Telefons, nachts am Tresen wird die Oberfläche also von
selbst schwarz.

Dringlichkeit kommt ohne Farbe aus: Ein Getränk in kritischem Zustand bekommt
einen gefüllten Punkt und eine kräftige Kontur, eine Warnung einen hohlen Punkt
und eine Haarlinie – dazu immer Klartext („unter Mindestbestand 2“). Das bleibt
auch bei Farbenblindheit, im Sonnenlicht und im Ausdruck lesbar.

## Technisch

- Eine Datei, ~2.600 Zeilen: HTML + CSS + JavaScript, keine Frameworks
- Firebase Web SDK v10 wird zur Laufzeit als ES-Modul von `gstatic.com` geladen
- Diagramme sind handgeschriebenes SVG, der QR-Code-Encoder (Byte-Modus,
  Fehlerkorrektur M, Version 1–10) ebenfalls – dadurch keine externen Skripte
  außer dem Firebase-SDK
