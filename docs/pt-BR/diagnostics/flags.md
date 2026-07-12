---
read_when:
    - Você precisa de logs de depuração específicos sem aumentar os níveis globais de registro
    - Você precisa coletar logs específicos do subsistema para obter suporte
summary: Flags de diagnóstico para logs de depuração direcionados
title: Sinalizadores de diagnóstico
x-i18n:
    generated_at: "2026-07-11T23:54:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9847f464fde89d9e639b089fe54fb933deb9debad2a6d8b120ab01bacff181a8
    source_path: diagnostics/flags.md
    workflow: 16
---

Os sinalizadores de diagnóstico ativam registros adicionais para um subsistema sem elevar
`logging.level` globalmente. Um sinalizador não tem efeito, a menos que um subsistema o verifique.

## Como funciona

- Os sinalizadores são strings que não diferenciam maiúsculas de minúsculas, resolvidas a partir de `diagnostics.flags` na
  configuração mais a substituição pela variável de ambiente `OPENCLAW_DIAGNOSTICS`, com duplicatas removidas e convertidas para minúsculas.
- `name.*` corresponde ao próprio `name` e a tudo sob `name.` (por exemplo,
  `telegram.*` corresponde a `telegram.http`).
- `*` ou `all` ativa todos os sinalizadores.
- Reinicie o Gateway após alterar `diagnostics.flags` na configuração; essa opção não é
  recarregada dinamicamente.

## Sinalizadores conhecidos

| Sinalizador      | Ativa                                                                       |
| ---------------- | --------------------------------------------------------------------------- |
| `telegram.http`  | Registro de erros HTTP da API de Bot do Telegram                            |
| `brave.http`     | Registro de solicitações/respostas/cache do Brave Search                    |
| `profiler`       | Profiler da etapa de resposta e profiler do servidor de aplicativo Codex (ambos) |
| `reply.profiler` | Somente o profiler da etapa de resposta                                     |
| `codex.profiler` | Somente o profiler do servidor de aplicativo Codex                          |
| `timeline`       | Artefato de linha do tempo JSONL estruturado (veja abaixo)                  |

## Ativar pela configuração

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Vários sinalizadores:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "brave.http", "gateway.*"]
  }
}
```

## Substituição por variável de ambiente (uso pontual)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,brave.http
```

Os valores são separados por vírgulas ou espaços em branco. Valores especiais:

| Valor                       | Efeito                                                     |
| --------------------------- | ---------------------------------------------------------- |
| `0`, `false`, `off`, `none` | Desativa todos os sinalizadores, substituindo também a configuração |
| `1`, `true`, `all`, `*`     | Ativa todos os sinalizadores                               |

`OPENCLAW_DIAGNOSTICS=0` desativa os sinalizadores provenientes tanto da variável de ambiente quanto da configuração para esse
processo, o que é útil para silenciar temporariamente um sinalizador de profiler mantido ativo na configuração
sem editar o arquivo.

## Sinalizadores de profiler

Os sinalizadores de profiler controlam intervalos leves de medição de tempo; quando desativados, não adicionam sobrecarga.

Ative todos os intervalos controlados por profiler para uma execução do Gateway:

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

Ative somente os intervalos do profiler de encaminhamento de respostas:

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

Ative somente os intervalos do profiler de inicialização/ferramentas/threads do servidor de aplicativo Codex:

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

`profiler` ativa tanto o profiler de resposta quanto o profiler do Codex; use os
nomes de sinalizadores com escopo para ativar apenas um deles.

Ou defina-os na configuração:

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

Reinicie o Gateway após alterar os sinalizadores de configuração. Para desativar um sinalizador de profiler,
remova-o de `diagnostics.flags` e reinicie, ou inicie o processo com
`OPENCLAW_DIAGNOSTICS=0` para substituir todos os sinalizadores de diagnóstico nessa execução.

## Artefatos de linha do tempo

O sinalizador `timeline` (alias: `diagnostics.timeline`) grava eventos estruturados de medição de tempo da inicialização
e da execução como JSONL, para mecanismos externos de QA:

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

Ou ative-o na configuração:

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

O caminho de saída sempre vem de `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`, mesmo
quando o próprio sinalizador é definido na configuração; não há uma chave de configuração para o caminho.
Quando `timeline` é ativado somente pela configuração, os primeiros intervalos de carregamento da configuração
ficam ausentes porque o OpenClaw ainda não leu a configuração; os intervalos subsequentes da inicialização
são capturados normalmente.

`OPENCLAW_DIAGNOSTICS=1`, `=all` e `=*` também ativam a linha do tempo, pois
ativam todos os sinalizadores. Prefira o sinalizador específico `timeline` quando quiser somente o
artefato JSONL, e não todos os outros sinalizadores de diagnóstico.

As amostras de atraso do loop de eventos na linha do tempo exigem uma ativação adicional além de
`timeline`: defina `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` (ou `on`/`true`/`yes`) além
de ativar a linha do tempo.

Os registros da linha do tempo usam o envelope `openclaw.diagnostics.v1` e podem incluir
IDs de processos, nomes de fases, nomes de intervalos, durações, IDs de plugins, contagens de
dependências, amostras de atraso do loop de eventos, nomes de operações do provedor, estado de saída
de processos filhos e nomes/mensagens de erros de inicialização. Trate os arquivos de linha do tempo como artefatos locais
de diagnóstico; revise-os antes de compartilhá-los fora da sua máquina.

## Destino dos registros

Os sinalizadores emitem registros no arquivo padrão de diagnóstico. Por padrão:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Se você definir `logging.file`, use esse caminho. Os registros estão no formato JSONL (um objeto JSON
por linha). A ocultação ainda é aplicada com base em `logging.redactSensitive`.
Consulte [Registro em log](/pt-BR/logging) para ver o modelo completo de resolução do caminho dos registros, rotação e
ocultação.

## Extrair registros

Selecione o arquivo de registro mais recente:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Filtre os diagnósticos HTTP do Telegram:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Filtre os diagnósticos HTTP do Brave Search:

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

Ou acompanhe enquanto reproduz o problema:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Para Gateways remotos, use `openclaw logs --follow` (consulte
[/cli/logs](/pt-BR/cli/logs)).

## Observações

- Se `logging.level` estiver definido com um nível superior a `warn`, os registros controlados por sinalizadores poderão ser
  suprimidos. O valor padrão `info` é adequado.
- `brave.http` registra URLs/parâmetros de consulta das solicitações do Brave Search, status/tempo
  das respostas e eventos de acerto/falha/gravação no cache. Ele não registra a chave da API
  (enviada como cabeçalho da solicitação) nem os corpos das respostas, mas as consultas de pesquisa podem ser
  confidenciais.
- É seguro manter os sinalizadores ativados; eles afetam somente o volume de registros do
  subsistema específico.
- Use [/logging](/pt-BR/logging) para alterar destinos, níveis e ocultação dos registros.

## Relacionado

- [Diagnóstico do Gateway](/pt-BR/gateway/diagnostics)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
