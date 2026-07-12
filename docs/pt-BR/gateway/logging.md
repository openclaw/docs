---
read_when:
    - Alteração da saída ou dos formatos de logs
    - Depuração da saída da CLI ou do Gateway
summary: Superfícies de registro, logs em arquivos, estilos de log de WS e formatação do console
title: Logs do Gateway
x-i18n:
    generated_at: "2026-07-12T15:12:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6717be5eac3dfc1acf36b2f21b049d46c7fc3678945295b10ae69781d89d35ad
    source_path: gateway/logging.md
    workflow: 16
---

# Registro em log

Para uma visão geral voltada ao usuário (CLI + UI de Controle + configuração), consulte [/logging](/pt-BR/logging).

O OpenClaw tem duas superfícies de registro em log:

- **Saída do console** - o que você vê no terminal / UI de Depuração.
- **Logs em arquivo** - linhas JSON gravadas pelo logger do Gateway.

Na inicialização, o Gateway registra o modelo padrão resolvido do agente, além dos padrões de modo que afetam novas sessões:

```text
modelo do agente: openai/gpt-5.6-sol (raciocínio=medium, rápido=ativado)
```

`thinking` vem do agente padrão, dos parâmetros do modelo ou do padrão global do agente; quando não definido, exibe `medium`. `fast` vem do agente padrão ou dos parâmetros `fastMode` do modelo.

## Logger baseado em arquivo

- O arquivo de log rotativo padrão fica em `/tmp/openclaw/` (um arquivo por dia): `openclaw-YYYY-MM-DD.log`, datado de acordo com o fuso horário local do host do Gateway. Se esse diretório não for seguro ou não permitir gravação (proprietário incorreto, gravável por todos ou um link simbólico), o OpenClaw usará como alternativa um caminho `os.tmpdir()/openclaw-<uid>` com escopo de usuário; no Windows, ele sempre usa essa alternativa no diretório temporário do sistema operacional.
- Os arquivos de log ativos são rotacionados ao atingir `logging.maxFileBytes` (padrão: 100 MB), mantendo até cinco arquivos numerados (`.1` a `.5`) e continuando a gravar em um novo arquivo ativo.
- Configure o caminho e o nível do arquivo de log por meio de `~/.openclaw/openclaw.json`: `logging.file`, `logging.level`.
- O formato do arquivo contém um objeto JSON por linha.

Os caminhos de código de conversação, voz em tempo real e salas gerenciadas usam o logger de arquivo compartilhado para registros limitados do ciclo de vida, destinados à depuração operacional e à exportação de logs por OTLP. Texto de transcrição, payloads de áudio, IDs de turnos, IDs de chamadas e IDs de itens do provedor nunca são copiados para o registro de log.

A aba Logs da UI de Controle acompanha esse arquivo por meio do Gateway (`logs.tail`). A CLI faz o mesmo:

```bash
openclaw logs --follow
```

### Modo detalhado versus níveis de log

- **Logs em arquivo** são controlados exclusivamente por `logging.level`.
- `--verbose` afeta somente o **nível de detalhamento do console** (e o estilo de log do WS) — ele **não** eleva o nível de log do arquivo.
- Para capturar em arquivos de log detalhes disponíveis somente no modo detalhado, defina `logging.level` como `debug` ou `trace`.
- O registro em nível trace também inclui resumos de tempos de diagnóstico para caminhos críticos selecionados, como a preparação da fábrica de ferramentas de plugins. Consulte [/tools/plugin#slow-plugin-tool-setup](/pt-BR/tools/plugin#slow-plugin-tool-setup).

## Captura do console

A CLI captura `console.log/info/warn/error/debug/trace`, grava essas informações nos arquivos de log e ainda as exibe em stdout/stderr.

Ajuste o nível de detalhamento do console de forma independente:

- `logging.consoleLevel` (padrão: `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`; o padrão é `pretty` em um TTY e `compact` caso contrário)

## Mascaramento

O OpenClaw mascara tokens confidenciais antes que a saída de logs ou transcrições deixe o processo. Essa política de mascaramento se aplica aos destinos de texto do console, dos logs em arquivo, dos registros de log OTLP e das transcrições de sessão, para que os valores secretos correspondentes sejam mascarados antes que linhas JSONL ou mensagens sejam gravadas no disco.

- `logging.redactSensitive`: `off` | `tools` (padrão: `tools`)
- `logging.redactPatterns`: matriz de strings de expressões regulares (substitui os padrões)
  - Use strings de expressões regulares brutas (`gi` automático) ou `/pattern/flags` para sinalizadores personalizados.
  - As correspondências são mascaradas, mantendo os primeiros 6 e os últimos 4 caracteres (valores com >= 18 caracteres); valores mais curtos tornam-se `***`.
  - Os padrões abrangem atribuições comuns de chaves, sinalizadores da CLI, campos JSON, cabeçalhos bearer, blocos PEM, prefixos de tokens de fornecedores conhecidos e nomes de campos de credenciais de pagamento (número do cartão, CVC/CVV, token de pagamento compartilhado, credencial de pagamento).

Alguns limites de segurança sempre aplicam mascaramento, independentemente de `logging.redactSensitive`: eventos de chamada de ferramenta da interface de controle, saída da ferramenta `sessions_history`, exportações de suporte de diagnóstico, observações de erros de provedores, exibição de comandos para aprovação de execução e logs do protocolo WebSocket do Gateway. Essas superfícies ainda respeitam `logging.redactPatterns` como padrões adicionais, mas `redactSensitive: "off"` não faz com que emitam segredos brutos.

## Logs WebSocket do Gateway

O Gateway imprime logs do protocolo WebSocket em dois modos:

- **Modo normal (sem `--verbose`)**: imprime apenas resultados de RPC "relevantes": erros (`ok=false`), chamadas lentas (limite padrão: `>= 50ms`) e erros de análise.
- **Modo detalhado (`--verbose`)**: imprime todo o tráfego de solicitações/respostas WS.

### Estilo dos logs WS

`openclaw gateway` oferece uma opção de estilo específica por Gateway:

- `--ws-log auto` (padrão): o modo normal é otimizado; o modo detalhado usa saída compacta.
- `--ws-log compact`: saída compacta (solicitação/resposta em pares) no modo detalhado.
- `--ws-log full`: saída completa por quadro no modo detalhado.
- `--compact`: alias de `--ws-log compact`.

```bash
# otimizado (somente erros/chamadas lentas)
openclaw gateway

# mostrar todo o tráfego WS (em pares)
openclaw gateway --verbose --ws-log compact

# mostrar todo o tráfego WS (metadados completos)
openclaw gateway --verbose --ws-log full
```

## Formatação do console (logs de subsistemas)

O formatador do console **detecta TTY** e imprime linhas consistentes com prefixos. Os registradores de subsistemas mantêm a saída agrupada e fácil de examinar:

- **Prefixos de subsistemas** em cada linha (por exemplo, `[gateway]`, `[canvas]`, `[tailscale]`).
- **Cores dos subsistemas** (estáveis por subsistema, derivadas do hash do nome), além de cores por nível.
- **Cores quando a saída é um TTY** ou o ambiente parece ser um terminal avançado (`TERM`/`COLORTERM`/`TERM_PROGRAM`); respeita `NO_COLOR` e `FORCE_COLOR`.
- **Prefixos de subsistemas abreviados**: remove um segmento inicial `gateway/`, `channels/` ou `providers/` e mantém, no máximo, os 2 últimos segmentos restantes (por exemplo, `channels/turn/kernel` é exibido como `turn/kernel`). Subsistemas de canais conhecidos (`telegram`, `whatsapp`, `slack` etc.) sempre são reduzidos apenas ao nome do canal.
- **Registradores secundários por subsistema** (prefixo automático + campo estruturado `{ subsystem }`).
- **`logRaw()`** para saída de QR/UX (sem prefixo nem formatação).
- **Estilos do console**: `pretty` | `compact` | `json`.
- **O nível de log do console** é separado do nível de log do arquivo (o arquivo mantém todos os detalhes quando `logging.level` é `debug`/`trace`).
- **Corpos de mensagens do WhatsApp** são registrados no nível `debug` (use `--verbose` para vê-los).

Isso mantém os logs em arquivo estáveis e facilita a leitura da saída interativa.

## Relacionados

- [Logs](/pt-BR/logging)
- [Exportação do OpenTelemetry](/pt-BR/gateway/opentelemetry)
- [Exportação de diagnósticos](/pt-BR/gateway/diagnostics)
