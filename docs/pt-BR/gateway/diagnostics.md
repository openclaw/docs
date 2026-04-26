---
read_when:
    - Preparando um relatório de bug ou solicitação de suporte
    - Depurando falhas do Gateway, reinicializações, pressão de memória ou cargas muito grandes
    - Revisando quais dados de diagnóstico são registrados ou redigidos
summary: Criar pacotes compartilháveis de diagnósticos do Gateway para relatórios de bugs
title: Exportação de diagnósticos
x-i18n:
    generated_at: "2026-04-26T11:28:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64866d929ed42f8484aa7c153e3056bad7b594d9e02705c095b7005f3094ec36
    source_path: gateway/diagnostics.md
    workflow: 15
---

O OpenClaw pode criar um zip local de diagnósticos que é seguro para anexar a
relatórios de bug. Ele combina status do Gateway, integridade, logs, formato da configuração e
eventos recentes de estabilidade sem carga, todos sanitizados.

## Início rápido

```bash
openclaw gateway diagnostics export
```

O comando imprime o caminho do zip gravado. Para escolher um caminho:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Para automação:

```bash
openclaw gateway diagnostics export --json
```

## O que a exportação contém

O zip inclui:

- `summary.md`: visão geral legível por humanos para suporte.
- `diagnostics.json`: resumo legível por máquina de configuração, logs, status, integridade
  e dados de estabilidade.
- `manifest.json`: metadados da exportação e lista de arquivos.
- Formato da configuração sanitizado e detalhes de configuração não secretos.
- Resumos de logs sanitizados e linhas recentes de log redigidas.
- Snapshots de status e integridade do Gateway obtidos por best effort.
- `stability/latest.json`: pacote de estabilidade persistido mais recente, quando disponível.

A exportação é útil mesmo quando o Gateway está sem integridade. Se o Gateway não puder
responder a solicitações de status ou integridade, os logs locais, o formato da configuração e o pacote
de estabilidade mais recente ainda serão coletados quando disponíveis.

## Modelo de privacidade

Os diagnósticos foram projetados para serem compartilháveis. A exportação mantém dados operacionais
que ajudam na depuração, como:

- nomes de subsistemas, ids de plugins, ids de provedores, ids de canais e modos configurados
- códigos de status, durações, contagens de bytes, estado de fila e leituras de memória
- metadados de log sanitizados e mensagens operacionais redigidas
- formato da configuração e definições de recursos não secretos

A exportação omite ou redige:

- texto de chat, prompts, instruções, corpos de Webhook e saídas de ferramentas
- credenciais, chaves de API, tokens, cookies e valores secretos
- corpos brutos de requisição ou resposta
- ids de conta, ids de mensagem, ids brutos de sessão, nomes de host e nomes de usuário locais

Quando uma mensagem de log se parece com texto de payload de usuário, chat, prompt ou ferramenta, a
exportação mantém apenas a informação de que uma mensagem foi omitida e a contagem de bytes.

## Gravador de estabilidade

O Gateway registra por padrão um fluxo limitado de estabilidade sem carga quando
os diagnósticos estão ativados. Ele é voltado para fatos operacionais, não para conteúdo.

Inspecione o gravador ativo:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Inspecione o pacote de estabilidade persistido mais recente após uma saída fatal, timeout de desligamento
ou falha de inicialização após reinício:

```bash
openclaw gateway stability --bundle latest
```

Crie um zip de diagnósticos a partir do pacote persistido mais recente:

```bash
openclaw gateway stability --bundle latest --export
```

Os pacotes persistidos ficam em `~/.openclaw/logs/stability/` quando existem eventos.

## Opções úteis

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: grava em um caminho zip específico.
- `--log-lines <count>`: máximo de linhas de log sanitizadas a incluir.
- `--log-bytes <bytes>`: máximo de bytes de log a inspecionar.
- `--url <url>`: URL WebSocket do Gateway para snapshots de status e integridade.
- `--token <token>`: token do Gateway para snapshots de status e integridade.
- `--password <password>`: senha do Gateway para snapshots de status e integridade.
- `--timeout <ms>`: tempo limite de snapshots de status e integridade.
- `--no-stability-bundle`: ignora a busca por pacote de estabilidade persistido.
- `--json`: imprime metadados da exportação legíveis por máquina.

## Desativar diagnósticos

Os diagnósticos são ativados por padrão. Para desativar o gravador de estabilidade e
a coleta de eventos de diagnóstico:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Desativar diagnósticos reduz o nível de detalhe dos relatórios de bug. Isso não afeta o
logging normal do Gateway.

## Relacionados

- [Verificações de integridade](/pt-BR/gateway/health)
- [CLI do Gateway](/pt-BR/cli/gateway#gateway-diagnostics-export)
- [Protocolo do Gateway](/pt-BR/gateway/protocol#system-and-identity)
- [Logging](/pt-BR/logging)
- [Exportação OpenTelemetry](/pt-BR/gateway/opentelemetry) — fluxo separado para transmitir diagnósticos a um coletor
