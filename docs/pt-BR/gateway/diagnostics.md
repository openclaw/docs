---
read_when:
    - Preparando um relatório de bug ou solicitação de suporte
    - Depurando falhas, reinicializações, pressão de memory ou cargas excessivas do Gateway
    - Revisando quais dados de diagnóstico são registrados ou redigidos
summary: Criar pacotes compartilháveis de diagnósticos do Gateway para relatórios de bug
title: Exportação de diagnósticos
x-i18n:
    generated_at: "2026-04-24T05:50:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3773b623a3f94a1f1340f2d278d9f5236f18fbf9aa38f84ec9ddbe41aea44e8c
    source_path: gateway/diagnostics.md
    workflow: 15
---

O OpenClaw pode criar um arquivo zip local de diagnósticos que é seguro para anexar a
relatórios de bug. Ele combina status sanitizado do Gateway, saúde, logs, forma da configuração e
eventos recentes de estabilidade sem carga.

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
- `diagnostics.json`: resumo legível por máquina de configuração, logs, status, saúde
  e dados de estabilidade.
- `manifest.json`: metadados da exportação e lista de arquivos.
- Forma sanitizada da configuração e detalhes de configuração não secretos.
- Resumos sanitizados de logs e linhas recentes de log com redação.
- Snapshots de status e saúde do Gateway com melhor esforço.
- `stability/latest.json`: bundle de estabilidade persistido mais recente, quando disponível.

A exportação é útil mesmo quando o Gateway está sem saúde. Se o Gateway não puder
responder a solicitações de status ou saúde, os logs locais, a forma da configuração e o bundle
de estabilidade mais recente ainda serão coletados quando disponíveis.

## Modelo de privacidade

Os diagnósticos foram projetados para serem compartilháveis. A exportação mantém dados operacionais
que ajudam na depuração, como:

- nomes de subsistemas, IDs de Plugin, IDs de provedor, IDs de canal e modos configurados
- códigos de status, durações, contagens de bytes, estado da fila e leituras de memory
- metadados de logs sanitizados e mensagens operacionais com redação
- forma da configuração e configurações de recursos não secretas

A exportação omite ou redige:

- texto de chat, prompts, instruções, corpos de Webhook e saídas de ferramenta
- credenciais, chaves de API, tokens, cookies e valores secretos
- corpos brutos de solicitação ou resposta
- IDs de conta, IDs de mensagem, IDs brutos de sessão, nomes de host e nomes de usuário locais

Quando uma mensagem de log parece conter texto de usuário, chat, prompt ou carga de ferramenta, a
exportação mantém apenas a informação de que uma mensagem foi omitida e a contagem de bytes.

## Registrador de estabilidade

O Gateway registra por padrão um fluxo de estabilidade limitado e sem carga quando
os diagnósticos estão ativados. Ele serve para fatos operacionais, não conteúdo.

Inspecione o registrador ativo:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Inspecione o bundle de estabilidade persistido mais recente após uma saída fatal, timeout
de desligamento ou falha de inicialização após reinício:

```bash
openclaw gateway stability --bundle latest
```

Crie um zip de diagnósticos a partir do bundle persistido mais recente:

```bash
openclaw gateway stability --bundle latest --export
```

Bundles persistidos ficam em `~/.openclaw/logs/stability/` quando existem eventos.

## Opções úteis

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: grava em um caminho específico de zip.
- `--log-lines <count>`: número máximo de linhas de log sanitizadas a incluir.
- `--log-bytes <bytes>`: número máximo de bytes de log a inspecionar.
- `--url <url>`: URL WebSocket do Gateway para snapshots de status e saúde.
- `--token <token>`: token do Gateway para snapshots de status e saúde.
- `--password <password>`: senha do Gateway para snapshots de status e saúde.
- `--timeout <ms>`: timeout do snapshot de status e saúde.
- `--no-stability-bundle`: ignora a busca por bundle de estabilidade persistido.
- `--json`: imprime metadados da exportação legíveis por máquina.

## Desativar diagnósticos

Os diagnósticos vêm ativados por padrão. Para desativar o registrador de estabilidade e
a coleta de eventos diagnósticos:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Desativar diagnósticos reduz o nível de detalhe em relatórios de bug. Isso não afeta o
logging normal do Gateway.

## Documentação relacionada

- [Health Checks](/pt-BR/gateway/health)
- [CLI do Gateway](/pt-BR/cli/gateway#gateway-diagnostics-export)
- [Gateway Protocol](/pt-BR/gateway/protocol#system-and-identity)
- [Logging](/pt-BR/logging)
