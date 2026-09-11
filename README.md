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
| **Startseite** | Zeigt den **aktuellen Bestand** aller Getränke auf einen Blick – letzte Zählung plus alles, was seitdem dazugekauft wurde – mit Reichweite in Tagen und Dringlichkeitsmarkierung. Antippen zählt dieses eine Getränk nach. Darüber drei Kennzahlen: Anzahl Getränke, wie viele knapp werden, wann zuletzt gezählt wurde. |
| **Zählrunde** | Geführt, ein Getränk nach dem anderen, nach Kategorie sortiert, mit Fortschrittsanzeige. Der Zahlenblock steht direkt darunter – kein Suchen in langen Listen. Überspringen ist erlaubt, die Übersicht zeigt jederzeit, was schon gezählt ist und was fehlt. Wahlweise nur eine Kategorie oder **nur das, was knapp wird**. |
| **Kontrolle beim Tippen** | Schon während der Eingabe steht darunter, was die Zahl bedeutet: „das wären 12 Flaschen verbraucht in 7 Tagen · Ø 1,7/Tag“. Steigt der Bestand oder liegt der Verbrauch um ein Vielfaches über dem Schnitt, wird deutlich gewarnt – ein Vertipper fällt auf, solange er noch zu ändern ist. |
| **Unterbrechbar** | Eine angefangene Runde übersteht das Schließen der Seite: Position und erfasste Mengen sind beim nächsten Öffnen wieder da (bis zu zwei Tage). |
| **Zurücknehmen** | Eine gerade gespeicherte Zählung lässt sich rückgängig machen. Die Mengen bleiben dabei als ungespeicherte Zählung stehen, sodass sich ein Fehler korrigieren lässt, ohne noch einmal durch die ganze Bar zu laufen. |
| **Kästen** | Es gilt überall **1 Kasten = 20 Flaschen**, ohne dass man etwas einträgt. Gezählt wird in **Kästen + einzelne Flaschen**, und das Tool rechnet von selbst um: 22 Flaschen sind 1 Kasten + 2, 44 sind 2 Kästen + 4. Abweichungen (Cola-Kiste mit 12) stehen am Getränk, eine 0 dort heißt „gibt es nur einzeln“. Gespeichert und gerechnet wird immer in Einzelflaschen. |
| **Zusammenfassung** | Direkt nach dem Speichern: was sich verändert hat, was verbraucht wurde, wo der Bestand gestiegen ist – ohne selbst zu rechnen. |
| **Einkaufsliste** | Füllt sich von selbst aus Warnschwelle und Vorhersage, mit Mengenvorschlag in vollen Kästen. Die Menge lässt sich direkt in der Zeile ändern – **ein Schritt ist ein Kasten**, die Zahl selbst öffnet den Zahlenblock für krumme Mengen. Eigene Positionen (auch freie Notizen wie „Eis“) lassen sich ergänzen. Abhaken bucht den Kauf als Nachkauf – die Position verschwindet dadurch von allein. |
| **Nachkauf** | Jeden Einkauf separat erfassen, damit der Verbrauch korrekt bleibt (ein Nachkauf ist kein Verbrauch). Geliefert wird nichts – die Kästen werden selbst vom Getränkemarkt geholt und hier eingebucht. |
| **Statistik** | Verbrauch zwischen zwei Zählungen, Ranking der beliebtesten Getränke, Verlaufsdiagramm pro Getränk, Filter nach Kategorie und Zeitraum. Mengen wahlweise in Flaschen oder in Kästen. |
| **Vorhersage** | Ø-Verbrauch pro Tag/Woche und Hochrechnung, wann ein Getränk leer ist – **nur wenn die Datenlage das hergibt** (siehe unten). |
| **Erinnerung** | „Bald nachkaufen“ steht ganz oben auf der Startseite, sortiert nach Dringlichkeit – im Klartext: „nur noch 1 Kasten im Lager“. |
| **Warnschwelle** | Unter **Mehr → Einstellungen** einstellbar, ab wie vielen Kästen ein Getränk als knapp gilt (Standard: 1 Kasten). Dazu wie bisher die Reichweite in Tagen. Beide Schwellen gelten für die **ganze Bar**, nicht nur für das Telefon, auf dem sie gesetzt wurden. |
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

Die Daten liegen unter `bars/<bar-id>/…` in fünf Sammlungen: `drinks`
(`packSize` = Flaschen je Kasten, `packName` = das Wort dafür), `counts`, `purchases`,
`shopping` (die Einkaufsliste) und `settings` mit dem einzelnen Dokument
`thresholds` (`warnDays`, `minPacks`). `qty` ist in allen Fällen die Menge in
Einzelflaschen.

> **Zur Sicherheit:** Ohne Login müssen die Regeln offen sein – wer die
> Projekt-ID kennt, kann in `bars/staffelbar/…` lesen und schreiben. Alles
> außerhalb dieses Pfads ist gesperrt. Wer es enger braucht, nutzt Firebase
> App Check oder anonyme Anmeldung.

---

## Kästen und Flaschen

Die Hausregel steht als `DEFAULT_PACK_SIZE` oben in `index.html`: **1 Kasten =
20 Flaschen**, gültig für jedes Getränk, bei dem nichts anderes hinterlegt ist.
Wer eine andere Gebindegröße braucht, trägt sie am Getränk ein; eine 0 bedeutet
dort „dieses Getränk gibt es nur einzeln“.

Eine Regel für alles: **gerechnet und gespeichert wird immer in Einzelflaschen**.
Kästen sind reine Ein- und Ausgabe. Beim Zählen lassen sich Kästen und einzelne
Flaschen getrennt eintippen, und beides geht auch gemischt: Wer 22 in das
Flaschen-Feld tippt, sieht sofort „macht 1 Kasten + 2 Flaschen“. Angezeigt wird
wieder in Kästen, sofern das eingeschaltet ist (*Mehr → Einstellungen*, oder der
Umschalter in der Statistik).

Das hat einen Grund: Ändert sich später die Kastengröße, bleiben alte Zahlen
trotzdem vergleichbar, und Getränke mit und ohne Kasten lassen sich in derselben
Statistik nebeneinander stellen. Ein Getränk ohne Kastenangabe wird einfach
nur einzeln geführt.

## Wie der Verbrauch berechnet wird

Zwischen zwei Zählungen gilt:

```
Verbrauch = Bestand(alt) + Nachkäufe dazwischen − Bestand(neu)
```

Deshalb muss jeder Einkauf als **Nachkauf** erfasst werden – sonst sieht es aus,
als wäre weniger verbraucht worden. Steigt der Bestand ohne erfassten Nachkauf,
markiert das Tool den Abschnitt und lässt ihn aus dem Durchschnitt heraus,
statt die Zahlen stillschweigend zu verfälschen.

## Wann ein Getränk als knapp gilt

Drei Regeln, die unabhängig voneinander greifen – eine reicht:

| Regel | Wo eingestellt |
|---|---|
| Bestand ≤ **Warnschwelle in Kästen** (Standard 1 Kasten) | Mehr → Einstellungen |
| Reichweite laut Hochrechnung < **Warnschwelle in Tagen** (Standard 7) | Mehr → Einstellungen |
| Bestand ≤ **Mindestbestand** des einzelnen Getränks | Getränke → Bearbeiten |

Hat ein Getränk einen eigenen Mindestbestand, geht dieser der Kästen-Schwelle
vor. Auf die Hälfte der Schwelle abgesunken, wird aus der Warnung ein
kritischer Posten (gefüllter Punkt, kräftige Kontur) und rutscht nach oben.

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
- **Warnschwellen** liegen in Firestore und gelten damit für alle Geräte.
  Ohne Firebase-Konfiguration bleiben sie lokal auf dem Gerät.
- **Angefangene Runden** liegen nur im Browser des Geräts (`localStorage`),
  nicht in Firestore. Wer die Runde auf dem Telefon beginnt, beendet sie auch
  dort – gespeichert wird erst beim Abschluss, und dann für alle.
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
