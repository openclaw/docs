---
read_when:
    - Inicialização manual de um espaço de trabalho
summary: Modelo de espaço de trabalho para TOOLS.md
title: Modelo de TOOLS.md
x-i18n:
    generated_at: "2026-07-12T00:23:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 20eab78b3b117566a1d33a70873e70ff2d5099543aa44e2719dc8d0797099afe
    source_path: reference/templates/TOOLS.md
    workflow: 16
---

# TOOLS.md - Notas locais

Skills definem _como_ as ferramentas funcionam. Este arquivo é destinado às _suas_ particularidades — aquilo que é exclusivo da sua configuração: nomes e locais de câmeras, hosts e aliases SSH, vozes de TTS preferidas, nomes de alto-falantes/salas, apelidos de dispositivos e qualquer item específico do ambiente.

## Exemplos

```markdown
### Câmeras

- sala-de-estar → Área principal, grande angular de 180°
- porta-da-frente → Entrada, acionada por movimento

### SSH

- servidor-doméstico → 192.168.1.100, usuário: admin

### TTS

- Voz preferida: "Nova" (acolhedora, levemente britânica)
- Alto-falante padrão: HomePod da cozinha
```

## Por que manter separado?

Skills são compartilhadas. Sua configuração é sua. Mantê-las separadas permite atualizar Skills sem perder suas notas e compartilhar Skills sem expor sua infraestrutura.

---

Adicione tudo o que ajudar você a realizar seu trabalho. Esta é sua folha de consulta rápida.

## Relacionado

- [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace)
