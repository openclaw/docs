---
read_when:
    - Você quer ler resumos de transcrições armazenados pelo terminal
    - Você precisa do caminho para um resumo de transcrições em Markdown
    - Você está depurando o layout de armazenamento dos transcripts principais
summary: Referência da CLI para `openclaw transcripts` (listar, mostrar e localizar transcrições armazenadas)
title: CLI de transcrições
x-i18n:
    generated_at: "2026-06-27T17:22:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae6010cfb4e051182f1c48d0d728b30d054542e1e7983ff15a2432840193f9c0
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

Inspecione transcrições gravadas pela ferramenta principal `transcripts` do OpenClaw. Esta CLI é
somente leitura; captura, importação e resumo pertencem à ferramenta do agente e às
fontes de início automático configuradas.

Use a CLI quando quiser encontrar as notas de ontem, abrir o arquivo Markdown em
um editor, enviar uma transcrição para outra ferramenta ou depurar onde uma sessão foi gravada no
disco. Ela não inicia nem interrompe a captura.

Os artefatos ficam no diretório de estado do OpenClaw:

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

O diretório de estado padrão é `~/.openclaw`; defina `OPENCLAW_STATE_DIR` para usar um
diretório diferente. O diretório de data vem do horário de início da sessão, e o
diretório da sessão é um segmento seguro de sistema de arquivos derivado do id da sessão.

## Comandos

```bash
openclaw transcripts list
openclaw transcripts show <session>
openclaw transcripts show YYYY-MM-DD/<session>
openclaw transcripts path <session>
openclaw transcripts path YYYY-MM-DD/<session>
openclaw transcripts path <session> --dir
openclaw transcripts path <session> --metadata
openclaw transcripts path <session> --transcript
openclaw transcripts list --json
openclaw transcripts show <session> --json
openclaw transcripts path <session> --json
```

- `list`: lista sessões armazenadas, seletor qualificado por data, horário de início, título e caminho de `summary.md`.
- `show <session>`: imprime o `summary.md` armazenado.
- `path <session>`: imprime o caminho de `summary.md`.
- `path <session> --dir`: imprime o diretório da sessão.
- `path <session> --metadata`: imprime `metadata.json`.
- `path <session> --transcript`: imprime `transcript.jsonl`.
- `--json`: imprime saída legível por máquina.

Quando um id de sessão humano se repete em vários dias, use o seletor qualificado
por data de `list`, por exemplo `openclaw transcripts show 2026-05-22/standup`.
Ids de sessão padrão incluem um timestamp e um sufixo aleatório; configure ids de
sessão fixos somente quando eles forem únicos dentro do dia.

## Saída

`list` imprime uma sessão por linha:

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  Weekly standup  /Users/alex/.openclaw/transcripts/2026-05-22/standup/summary.md
```

A saída é separada por tabulações. As colunas são seletor, horário de início, título e
caminho do resumo. O seletor é o valor mais seguro para passar de volta para `show` ou `path`.

`list --json` imprime objetos com:

- `sessionId`
- `selector`
- `date`
- `title`
- `startedAt`
- `stoppedAt`
- `source`
- `path`
- `summaryPath`
- `hasSummary`

`show --json` retorna os metadados armazenados da sessão, seletor, diretório da sessão,
caminho do resumo e texto Markdown do resumo. `path --json` retorna o caminho selecionado
e se esse arquivo existe.

## Muitas reuniões por dia

Transcrições agrupa sessões por data e depois por id de sessão. Dez reuniões em um
dia viram dez pastas irmãs:

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

Use ids gerados padrão para a maioria das automações. Use um id fixo como `standup`
somente quando o mesmo id não for usado duas vezes na mesma data.

## Resumos ausentes

Sessões ao vivo gravam `summary.md` quando a sessão para. Transcrições importadas
gravam `summary.md` imediatamente após a importação. Uma sessão ainda pode aparecer em
`list` sem resumo quando a captura está ativa, um provedor falhou durante a parada,
ou metadados foram gravados antes de qualquer fala chegar.

Use `path <session> --transcript` para inspecionar a transcrição somente acréscimo, e use
a ação `summarize` da ferramenta `transcripts` para regenerar o resumo Markdown.

## Configuração

A captura de transcrições é opcional porque fontes ao vivo podem entrar e gravar áudio
de reuniões. Ative a ferramenta com `transcripts.enabled` no nível superior:

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

Configure fontes de início automático com `transcripts.autoStart` em `openclaw.json`.
Cada entrada é ativada por estar presente; omita uma entrada para desativar essa fonte.

```json
{
  "transcripts": {
    "enabled": true,
    "autoStart": [
      {
        "providerId": "discord-voice",
        "guildId": "1234567890",
        "channelId": "2345678901"
      },
      {
        "providerId": "slack-huddle",
        "accountId": "workspace",
        "channelId": "C123"
      }
    ]
  }
}
```
