---
read_when:
    - Uruchamiasz skrypty z repozytorium
    - Dodajesz lub zmieniasz skrypty w ./scripts
summary: 'Skrypty repozytorium: przeznaczenie, zakres i uwagi dotyczące bezpieczeństwa'
title: Skrypty
x-i18n:
    generated_at: "2026-04-05T13:55:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: de53d64d91c564931bdd4e8b9f4a8e88646332a07cc2a6bf1d517b89debb29cd
    source_path: help/scripts.md
    workflow: 15
---

# Skrypty

Katalog `scripts/` zawiera skrypty pomocnicze do lokalnych przepływów pracy i zadań operacyjnych.
Używaj ich, gdy zadanie jest wyraźnie powiązane ze skryptem; w przeciwnym razie preferuj CLI.

## Konwencje

- Skrypty są **opcjonalne**, chyba że są wymienione w dokumentacji lub checklistach wydań.
- Preferuj powierzchnie CLI, jeśli istnieją (przykład: monitorowanie uwierzytelniania używa `openclaw models status --check`).
- Zakładaj, że skrypty są zależne od hosta; przeczytaj je przed uruchomieniem na nowej maszynie.

## Skrypty monitorowania uwierzytelniania

Monitorowanie uwierzytelniania opisano w [Uwierzytelnianie](/gateway/authentication). Skrypty w `scripts/` to opcjonalne dodatki dla przepływów systemd/Termux phone.

## Przy dodawaniu skryptów

- Utrzymuj skrypty w skupionej formie i dobrze udokumentowane.
- Dodaj krótki wpis w odpowiedniej dokumentacji (lub utwórz ją, jeśli brakuje).
