# H5P Multiple Personality Quiz Erweiterung

Dieses Repository enthält eine erweiterte Version des H5P Personality Quiz von [LumeniaAS](https://github.com/LumeniaAS/h5p-personality-quiz), die im Rahmen einer Semesterarbeit an der TH Lübeck im SS24 durchgeführt wurde.

## Projektbeschreibung

Diese Erweiterung des H5P Personality Quiz bietet zusätzliche Funktionalitäten und Verbesserungen gegenüber der ursprünglichen Version. Das Projekt wurde als Teil einer akademischen Arbeit durchgeführt und dient primär Dokumentationszwecken.

## Änderungen und Funktionen

Insgesamt wurde das Konzept erfolgreich umgesetzt und die Zielsetzung erreicht, sodass durch die Implementierung des erweiterten Modus, des Multipliers und des Balkendiagramms eine differenzierte und detaillierte Auswertung erreicht wurde. Hier sind die wichtigsten Änderungen und Funktionen:

- **Erweiterter Modus:** Ausgabe aller Personalities, inklusive der Visualisierung der Übereinstimmungsrate anhand eines Balkendiagramms sowie der Ausgabe weiterer Metadaten.
- **Multiplier:** Die Antwortmöglichkeiten können unterschiedlich gewichtet werden, was zu einer differenzierteren und individuelleren Auswertung führt.
- **Trennung von erweitertem und Standardmodus:** Verhindert Beeinträchtigungen bestehender Installationen und ermöglicht eine effiziente Wartung und Fehlerbehebung.
- **Erweiterung des Feldes "description":** Die Zeichenanzahl wurde erhöht und das Feld mit dem H5P HTML Widget erweitert.

## Technische Details

- **Basiert auf dem ursprünglichen H5P Personality Quiz von LumeniaAS:**
  - [Original-Repository](https://github.com/LumeniaAS/h5p-personality-quiz)
- **Verwendete Technologien und Frameworks:**
  - **Chart.js:** Wird für die Visualisierung der Übereinstimmungsrate mittels Balkendiagrammen verwendet. Weitere Informationen zu Chart.js finden Sie [hier](https://www.chartjs.org/).
- **Weitere Abhängigkeiten:**
  - H5P Core Library
  - H5PEditor.ColorSelector
  - jQuery

## Installation

Da dieses Repository hauptsächlich der Dokumentation dient, gibt es keine spezifischen Installationsanweisungen. Interessierte können jedoch den Code einsehen und bei Bedarf in ihre eigenen H5P-Projekte integrieren.