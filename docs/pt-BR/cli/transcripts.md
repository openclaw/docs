---
read_when:
    - Você quer ler resumos armazenados de transcrições pelo terminal
    - Você precisa do caminho para um resumo em Markdown das transcrições
    - Você está depurando o layout de armazenamento das transcrições principais
summary: Referência da CLI para `openclaw transcripts` (listar, exibir e localizar transcrições armazenadas)
title: CLI de transcrições
x-i18n:
    generated_at: "2026-07-11T23:50:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde02e924339c64cf6acd5c4b6162785dcfccf4a1df2aac0d9d52d5306511579
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

Inspetor somente leitura das transcrições gravadas pela ferramenta de agente `transcripts`.
A captura, a importação e a sumarização são executadas por essa ferramenta, não por esta CLI.

Os artefatos ficam no diretório de estado:

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

O diretório de estado padrão é `~/.openclaw`; substitua-o com `OPENCLAW_STATE_DIR`.
O diretório de data é determinado pelo horário de início da sessão; o diretório da sessão é
um slug seguro para o sistema de arquivos derivado do ID da sessão.

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

| Comando                       | Descrição                                               |
| ----------------------------- | ------------------------------------------------------- |
| `list`                        | Lista as sessões armazenadas.                           |
| `show <session>`              | Exibe o `summary.md` armazenado.                         |
| `path <session>`              | Exibe o caminho de `summary.md`.                         |
| `path <session> --dir`        | Exibe o diretório da sessão.                             |
| `path <session> --metadata`   | Exibe `metadata.json`.                                   |
| `path <session> --transcript` | Exibe `transcript.jsonl`.                                |
| `--json`                      | Exibe uma saída legível por máquina (qualquer subcomando). |

`<session>` aceita um ID de sessão simples ou um seletor qualificado por data
(`YYYY-MM-DD/<session>`). Use a forma qualificada quando o mesmo ID de sessão
ocorrer em mais de um dia, por exemplo, `openclaw transcripts show
2026-05-22/standup`. Os IDs de sessão padrão incluem um carimbo de data e hora e um
sufixo aleatório; atribua um ID fixo a uma sessão somente quando esse ID for exclusivo no dia.

## Saída

`list` exibe uma linha separada por tabulações para cada sessão: seletor, horário de início, título
e caminho do resumo.

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  Reunião semanal  /Users/user/.openclaw/transcripts/2026-05-22/standup/summary.md
```

O seletor é o valor mais seguro para passar novamente a `show` ou `path`.

`list --json` retorna objetos com `sessionId`, `selector`, `date`, `title`,
`startedAt`, `stoppedAt`, `source`, `path`, `summaryPath`, `hasSummary`.

`show --json` retorna os metadados armazenados da sessão, o seletor, o diretório da
sessão, o caminho do resumo e o texto do resumo em Markdown.

`path --json` retorna o caminho selecionado e informa se esse arquivo existe.

## Várias sessões por dia

As sessões são agrupadas por data e, depois, por ID da sessão. Dez reuniões em um dia tornam-se
dez pastas irmãs:

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

Use os IDs gerados por padrão para automação. Use um ID fixo, como `standup`, somente
quando ele não se repetir na mesma data.

## Resumos ausentes

As sessões ao vivo gravam `summary.md` quando a sessão é encerrada; as transcrições importadas
o gravam imediatamente após a importação. Uma sessão pode aparecer em `list` sem um
resumo enquanto a captura ainda estiver ativa, se um provedor falhar durante o encerramento ou se
os metadados forem gravados antes da chegada de qualquer fala.

Use `path <session> --transcript` para inspecionar a transcrição bruta somente para acréscimo
ou execute a ação `summarize` da ferramenta `transcripts` para gerar novamente o resumo
em Markdown.

## Configuração

A captura é opcional (fontes ao vivo podem entrar e gravar o áudio da reunião). Ative-a
com:

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

- `enabled` (padrão `false`): ativa a ferramenta.
- `maxUtterances` (padrão `2000`, limitado a 1-10000): tamanho do buffer de falas por
  sessão.

Configure as fontes de início automático com `transcripts.autoStart`. Cada entrada é
ativada quando está presente; omita uma entrada para desativar essa fonte. `discord-voice`
é a fonte integrada compatível com início automático e exige `guildId` e
`channelId`:

```json
{
  "transcripts": {
    "enabled": true,
    "autoStart": [
      {
        "providerId": "discord-voice",
        "guildId": "1234567890",
        "channelId": "2345678901"
      }
    ]
  }
}
```
