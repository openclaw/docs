---
read_when:
    - Alteração da saída ou dos formatos de log
    - Depuração da saída da CLI ou do Gateway
summary: Superfícies de registro, logs em arquivo, estilos de log de WS e formatação do console
title: Registro em log do Gateway
x-i18n:
    generated_at: "2026-07-11T23:58:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6717be5eac3dfc1acf36b2f21b049d46c7fc3678945295b10ae69781d89d35ad
    source_path: gateway/logging.md
    workflow: 16
---

# Registro de logs

Para uma visão geral voltada ao usuário (CLI + interface de controle + configuração), consulte [/logging](/pt-BR/logging).

O OpenClaw tem duas superfícies de logs:

- **Saída do console** - o que você vê no terminal/interface de depuração.
- **Logs em arquivo** - linhas JSON gravadas pelo logger do Gateway.

Na inicialização, o Gateway registra o modelo padrão resolvido do agente e os padrões de modo que afetam novas sessões:

```text
agent model: openai/gpt-5.6-sol (thinking=medium, fast=on)
```

`thinking` vem do agente padrão, dos parâmetros do modelo ou do padrão global do agente; quando não está definido, exibe `medium`. `fast` vem do agente padrão ou dos parâmetros `fastMode` do modelo.

## Logger baseado em arquivo

- O arquivo de log rotativo padrão fica em `/tmp/openclaw/` (um arquivo por dia): `openclaw-YYYY-MM-DD.log`, datado conforme o fuso horário local do host do Gateway. Se esse diretório não for seguro ou não permitir gravação (proprietário incorreto, gravável por todos ou um link simbólico), o OpenClaw usará como alternativa um caminho `os.tmpdir()/openclaw-<uid>` com escopo de usuário; no Windows, ele sempre usa essa alternativa no diretório temporário do sistema operacional.
- Os arquivos de log ativos são rotacionados ao atingir `logging.maxFileBytes` (padrão: 100 MB), mantendo até cinco arquivos numerados (`.1` a `.5`) e continuando a gravação em um novo arquivo ativo.
- Configure o caminho e o nível do arquivo de log por meio de `~/.openclaw/openclaw.json`: `logging.file`, `logging.level`.
- O formato do arquivo é um objeto JSON por linha.

Os caminhos de código de conversa, voz em tempo real e salas gerenciadas usam o logger de arquivo compartilhado para registros limitados do ciclo de vida destinados à depuração operacional e à exportação de logs OTLP. Texto de transcrições, cargas úteis de áudio, IDs de turnos, IDs de chamadas e IDs de itens do provedor nunca são copiados para o registro de log.

A aba de logs da interface de controle acompanha esse arquivo por meio do Gateway (`logs.tail`). A CLI faz o mesmo:

```bash
openclaw logs --follow
```

### Modo detalhado versus níveis de log

- **Os logs em arquivo** são controlados exclusivamente por `logging.level`.
- `--verbose` afeta apenas o **nível de detalhamento do console** (e o estilo dos logs de WS) — ele **não** aumenta o nível dos logs em arquivo.
- Para capturar nos logs em arquivo detalhes disponíveis apenas no modo detalhado, defina `logging.level` como `debug` ou `trace`.
- O registro no nível `trace` também inclui resumos de temporização para diagnóstico de determinados caminhos críticos, como a preparação da fábrica de ferramentas de plugins. Consulte [/tools/plugin#slow-plugin-tool-setup](/pt-BR/tools/plugin#slow-plugin-tool-setup).

## Captura do console

A CLI captura `console.log/info/warn/error/debug/trace`, grava essas mensagens nos logs em arquivo e ainda as imprime em stdout/stderr.

Ajuste o nível de detalhamento do console de forma independente:

- `logging.consoleLevel` (padrão: `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`; o padrão é `pretty` em um TTY e `compact` caso contrário)

## Mascaramento

O OpenClaw mascara tokens confidenciais antes que a saída de logs ou transcrições deixe o processo. Essa política de mascaramento se aplica aos destinos de texto do console, dos logs em arquivo, dos registros de log OTLP e das transcrições de sessão, portanto os valores secretos correspondentes são mascarados antes que linhas JSONL ou mensagens sejam gravadas em disco.

- `logging.redactSensitive`: `off` | `tools` (padrão: `tools`)
- `logging.redactPatterns`: matriz de strings de expressões regulares (substitui os padrões)
  - Use strings de expressões regulares brutas (`gi` automático) ou `/pattern/flags` para sinalizadores personalizados.
  - As correspondências são mascaradas mantendo os primeiros 6 e os últimos 4 caracteres (para valores com 18 caracteres ou mais); valores mais curtos tornam-se `***`.
  - Os padrões abrangem atribuições comuns de chaves, sinalizadores da CLI, campos JSON, cabeçalhos bearer, blocos PEM, prefixos de tokens de fornecedores populares e nomes de campos de credenciais de pagamento (número do cartão, CVC/CVV, token de pagamento compartilhado e credencial de pagamento).

Alguns limites de segurança sempre aplicam mascaramento, independentemente de `logging.redactSensitive`: eventos de chamadas de ferramentas da interface de controle, saída da ferramenta `sessions_history`, exportações de suporte para diagnóstico, observações de erros de provedores, exibição de comandos para aprovação de execução e logs do protocolo WebSocket do Gateway. Essas superfícies ainda respeitam `logging.redactPatterns` como padrões adicionais, mas `redactSensitive: "off"` não faz com que emitam segredos brutos.

## Logs de WebSocket do Gateway

O Gateway imprime logs do protocolo WebSocket em dois modos:

- **Modo normal (sem `--verbose`)**: imprime apenas resultados RPC "relevantes" — erros (`ok=false`), chamadas lentas (limite padrão: `>= 50ms`) e erros de análise.
- **Modo detalhado (`--verbose`)**: imprime todo o tráfego de solicitações/respostas WS.

### Estilo dos logs de WS

`openclaw gateway` oferece uma opção de estilo por Gateway:

- `--ws-log auto` (padrão): o modo normal é otimizado; o modo detalhado usa saída compacta.
- `--ws-log compact`: saída compacta (solicitação/resposta pareadas) no modo detalhado.
- `--ws-log full`: saída completa por quadro no modo detalhado.
- `--compact`: alias de `--ws-log compact`.

```bash
# otimizado (somente erros/lentas)
openclaw gateway

# mostrar todo o tráfego WS (pareado)
openclaw gateway --verbose --ws-log compact

# mostrar todo o tráfego WS (metadados completos)
openclaw gateway --verbose --ws-log full
```

## Formatação do console (logs de subsistemas)

O formatador do console **detecta TTY** e imprime linhas consistentes com prefixos. Os loggers de subsistemas mantêm a saída agrupada e fácil de examinar:

- **Prefixos de subsistemas** em cada linha (por exemplo, `[gateway]`, `[canvas]`, `[tailscale]`).
- **Cores dos subsistemas** (estáveis por subsistema, derivadas por hash do nome), além de cores por nível.
- **Cores quando a saída é um TTY** ou o ambiente parece ser um terminal avançado (`TERM`/`COLORTERM`/`TERM_PROGRAM`); respeita `NO_COLOR` e `FORCE_COLOR`.
- **Prefixos de subsistemas abreviados**: remove um segmento inicial `gateway/`, `channels/` ou `providers/` e mantém, no máximo, os 2 últimos segmentos restantes (por exemplo, `channels/turn/kernel` é exibido como `turn/kernel`). Subsistemas de canais conhecidos (`telegram`, `whatsapp`, `slack` etc.) são sempre reduzidos apenas ao nome do canal.
- **Loggers secundários por subsistema** (prefixo automático + campo estruturado `{ subsystem }`).
- **`logRaw()`** para saída de QR/UX (sem prefixo, sem formatação).
- **Estilos do console**: `pretty` | `compact` | `json`.
- **O nível de log do console** é separado do nível de log do arquivo (o arquivo mantém todos os detalhes quando `logging.level` é `debug`/`trace`).
- **Os corpos das mensagens do WhatsApp** são registrados no nível `debug` (use `--verbose` para vê-los).

Isso mantém os logs em arquivo estáveis e facilita a leitura da saída interativa.

## Relacionados

- [Registro de logs](/pt-BR/logging)
- [Exportação do OpenTelemetry](/pt-BR/gateway/opentelemetry)
- [Exportação de diagnósticos](/pt-BR/gateway/diagnostics)
