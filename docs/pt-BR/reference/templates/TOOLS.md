---
read_when:
    - Inicializando um workspace manualmente
summary: Modelo de workspace para `TOOLS.md`
title: Modelo de `TOOLS.md`
x-i18n:
    generated_at: "2026-04-24T06:12:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 810b088129bfd963ffe603a7e0a07d099fd2551bf13ebcb702905e1b8135d017
    source_path: reference/templates/TOOLS.md
    workflow: 15
---

# TOOLS.md - Observações locais

Skills definem _como_ as ferramentas funcionam. Este arquivo é para os detalhes _seus_ — as coisas que são exclusivas da sua configuração.

## O que entra aqui

Coisas como:

- Nomes e localizações de câmeras
- Hosts e aliases de SSH
- Vozes preferidas para TTS
- Nomes de caixas de som/salas
- Apelidos de dispositivos
- Qualquer coisa específica do ambiente

## Exemplos

```markdown
### Cameras

- living-room → Área principal, grande angular de 180°
- front-door → Entrada, acionada por movimento

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Voz preferida: "Nova" (acolhedora, levemente britânica)
- Caixa de som padrão: Kitchen HomePod
```

## Por que separado?

Skills são compartilhadas. Sua configuração é sua. Mantê-las separadas significa que você pode atualizar Skills sem perder suas anotações e compartilhar Skills sem vazar sua infraestrutura.

---

Adicione tudo o que ajudar você a fazer seu trabalho. Esta é a sua cola.

## Relacionado

- [Workspace do agente](/pt-BR/concepts/agent-workspace)
