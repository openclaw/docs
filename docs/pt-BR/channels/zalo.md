---
read_when:
    - Trabalhando em recursos ou webhooks do Zalo
summary: Status do suporte a bots do Zalo, recursos e configuração
title: Zalo
x-i18n:
    generated_at: "2026-07-12T14:57:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 36e624f1abeeaee56d7376b9df9209f8e7614ade2f089bcecd76ff746b942765
    source_path: channels/zalo.md
    workflow: 16
---

Status: experimental. Mensagens diretas e conversas em grupo estão implementadas; a tabela de [Recursos](#capabilities) abaixo reflete o comportamento verificado em bots do Zalo Bot Creator / Marketplace.

## Plugin incluído

O Zalo é distribuído como um Plugin incluído nas versões atuais do OpenClaw, portanto builds empacotadas não precisam de uma instalação separada.

Em uma build mais antiga ou em uma instalação personalizada que exclua o Zalo, instale o pacote npm diretamente:

- Instalação: `openclaw plugins install @openclaw/zalo`
- Versão fixada: `openclaw plugins install @openclaw/zalo@2026.6.11`
- De um checkout local: `openclaw plugins install ./path/to/local/zalo-plugin`
- Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração rápida

1. Crie um token de bot em [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) (faça login, crie um bot e defina as configurações). O token tem o formato `numeric_id:secret`; para bots do Marketplace, o token utilizável em tempo de execução pode aparecer na mensagem de boas-vindas do bot.
2. Defina o token usando a variável de ambiente `ZALO_BOT_TOKEN=...` (somente para a conta padrão) ou na configuração.
3. Reinicie o Gateway.
4. Aprove o código de pareamento no primeiro contato por mensagem direta (a política padrão de mensagens diretas é o pareamento).

Configuração mínima:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

Várias contas: adicione mais entradas em `channels.zalo.accounts.<id>`, cada uma com seu próprio `botToken`/`name`. `channels.zalo.botToken` (formato simples, sem `accounts`) é uma forma abreviada legada para uma única conta; prefira `accounts.<id>.*` em novas configurações.

## O que é

O Zalo é um aplicativo de mensagens voltado ao Vietnã. Sua API de bots permite que o Gateway execute um bot tanto para conversas individuais quanto para conversas em grupo, com roteamento determinístico de volta ao Zalo (o modelo nunca escolhe os canais).

Esta página aborda **bots do Zalo Bot Creator / Marketplace**. **Bots de Conta Oficial (OA) do Zalo** pertencem a uma área diferente do produto e podem se comportar de outra forma; esta página não os aborda.

## Como funciona

- As mensagens recebidas são normalizadas no envelope compartilhado do canal com espaços reservados para mídia.
- As respostas sempre são roteadas de volta para a mesma conversa do Zalo; respostas com citação não são usadas (`replyToMode` permanece desativado).
- Long polling (`getUpdates`) por padrão; o modo Webhook está disponível por meio de `channels.zalo.webhookUrl`.
- Os grupos exigem uma @menção para acionar o bot; isso não pode ser configurado por canal.

## Limites

| Limite                         | Valor                                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Tamanho do trecho de texto enviado | 2000 caracteres (limite da API do Zalo)                                                                   |
| Tamanho da mídia (recebida/enviada) | `channels.zalo.mediaMaxMb`, padrão `5` MB                                                                 |
| Corpo da solicitação do Webhook | 1 MB, tempo limite de leitura de 30s                                                                          |
| Limite de taxa do Webhook      | 120 solicitações / 60s por caminho+IP do cliente; em seguida, HTTP 429                                        |
| Janela de eventos duplicados do Webhook | 5 minutos (chave por caminho + conta + nome do evento + conversa + remetente + ID da mensagem)        |

## Controle de acesso

### Mensagens diretas

- `channels.zalo.dmPolicy`: `pairing` (padrão) | `allowlist` | `open` | `disabled`.
- Pareamento: remetentes desconhecidos recebem um código de pareamento; as mensagens são ignoradas até a aprovação. Os códigos expiram após 1 hora.
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
  - Detalhes: [Pareamento](/pt-BR/channels/pairing)
- `channels.zalo.allowFrom` aceita IDs numéricos de usuários do Zalo (sem busca por nome de usuário). `open` exige `"*"`.

### Grupos

As conversas em grupo são compatíveis com o Plugin (`chatTypes: ["direct", "group"]`) e são controladas por menção e pela política de grupos:

- `channels.zalo.groupPolicy`: `open` | `allowlist` | `disabled`.
- `channels.zalo.groupAllowFrom` restringe quais IDs de remetentes podem acionar o bot em grupos; recorre a `allowFrom` quando não está definido.
- Resolução padrão: quando `channels.zalo` está configurado, um `groupPolicy` não definido é resolvido como `open`. Quando `channels.zalo` está totalmente ausente, o tempo de execução adota `allowlist` de forma restritiva.
- Ressalva relatada em uso real: em algumas configurações de bots do Marketplace, não foi possível adicionar o bot a nenhum grupo. Se isso ocorrer, verifique as configurações do seu bot na Zalo Bot Platform; trata-se de uma restrição da plataforma, não de uma política do OpenClaw.

## Long polling versus Webhook

- Padrão: long polling (não exige URL pública).
- Modo Webhook: defina `channels.zalo.webhookUrl` e `channels.zalo.webhookSecret`.
  - A URL do Webhook deve usar HTTPS.
  - O segredo do Webhook deve ter de 8 a 256 caracteres.
  - O Zalo envia eventos com um cabeçalho `X-Bot-Api-Secret-Token`, verificado por meio de uma comparação em tempo constante.
  - O HTTP do Gateway processa as solicitações do Webhook em `channels.zalo.webhookPath` (o padrão é o caminho da URL do Webhook).
  - As solicitações devem usar `Content-Type: application/json` (ou um tipo de mídia `+json`).
  - De acordo com a documentação da API do Zalo, o polling de getUpdates e o Webhook são mutuamente exclusivos.

## Tipos de mensagem compatíveis

- Texto: compatibilidade completa, dividido em trechos de 2000 caracteres.
- Mídia: recebida/enviada, limitada por `mediaMaxMb`.
- Reações, threads, enquetes e comandos nativos: não são compatíveis com o Plugin.
- Streaming: o Plugin declara o recurso de streaming em blocos, mas o Zalo não tem controles dedicados de ajuste para fila de saída/mesclagem de texto (diferentemente de alguns outros canais regionais); verifique o comportamento atual no seu ambiente se isso for importante para seu caso de uso.

## Recursos

| Recurso                  | Status                                  |
| ------------------------ | --------------------------------------- |
| Mensagens diretas        | Compatível                              |
| Grupos                   | Compatível (exige menção)               |
| Mídia (recebida/enviada) | Compatível, limitada por `mediaMaxMb`   |
| Reações                  | Não compatível                          |
| Threads                  | Não compatível                          |
| Enquetes                 | Não compatível                          |
| Comandos nativos         | Não compatível                          |
| Resposta a / citação     | Não usada (permanece desativada)        |

## Destinos de entrega (CLI/Cron)

Use um ID de conversa como destino:

```bash
openclaw message send --channel zalo --target 123456789 --message "oi"
```

## Solução de problemas

**O bot não responde:**

- Verifique o token: `openclaw channels status --probe`
- Verifique se o remetente está aprovado (pareamento ou `allowFrom`)
- Verifique os logs do Gateway: `openclaw logs --follow`

**O Webhook não está recebendo eventos:**

- Confirme se a URL do Webhook usa HTTPS
- Confirme se o segredo tem de 8 a 256 caracteres
- Confirme se o endpoint HTTP do Gateway está acessível no caminho configurado
- Confirme se o polling de getUpdates também não está em execução (eles são mutuamente exclusivos)
- Uma rajada de solicitações pode retornar HTTP 429 (120 solicitações / 60s por caminho+IP); aguarde e tente novamente

## Referência de configuração

Configuração completa: [Configuração](/pt-BR/gateway/configuration)

| Configuração                                  | Descrição                                                       | Padrão                |
| -------------------------------------------- | ---------------------------------------------------------------- | --------------------- |
| `channels.zalo.enabled`                      | Ativa/desativa a inicialização do canal                          | `true`                |
| `channels.zalo.accounts.<id>.botToken`       | Token do bot obtido na Zalo Bot Platform                         | -                     |
| `channels.zalo.accounts.<id>.tokenFile`      | Lê o token de um arquivo (links simbólicos são rejeitados)       | -                     |
| `channels.zalo.accounts.<id>.name`           | Nome de exibição                                                  | -                     |
| `channels.zalo.accounts.<id>.enabled`        | Ativa/desativa esta conta                                        | `true`                |
| `channels.zalo.accounts.<id>.dmPolicy`       | Política de mensagens diretas por conta                          | `pairing`             |
| `channels.zalo.accounts.<id>.allowFrom`      | Lista de permissões de mensagens diretas (IDs de usuários)       | -                     |
| `channels.zalo.accounts.<id>.groupPolicy`    | Política de grupos por conta                                     | consulte [Grupos](#groups) |
| `channels.zalo.accounts.<id>.groupAllowFrom` | Lista de remetentes permitidos em grupos; recorre a `allowFrom`  | -                     |
| `channels.zalo.accounts.<id>.mediaMaxMb`     | Limite de mídia recebida/enviada (MB)                            | `5`                   |
| `channels.zalo.accounts.<id>.webhookUrl`     | Ativa o modo Webhook (HTTPS obrigatório)                         | -                     |
| `channels.zalo.accounts.<id>.webhookSecret`  | Segredo do Webhook (8-256 caracteres)                            | -                     |
| `channels.zalo.accounts.<id>.webhookPath`    | Caminho do Webhook no servidor HTTP do Gateway                   | caminho da URL do Webhook |
| `channels.zalo.accounts.<id>.proxy`          | URL do proxy para solicitações à API                             | -                     |
| `channels.zalo.accounts.<id>.responsePrefix` | Substituição do prefixo das respostas enviadas                   | -                     |
| `channels.zalo.defaultAccount`               | Conta padrão quando várias estão configuradas                    | `default`             |

`channels.zalo.botToken`, `channels.zalo.dmPolicy` e outras chaves simples de nível superior são a forma abreviada legada para uma única conta dos campos acima; os dois formatos são compatíveis.

Opção de ambiente: `ZALO_BOT_TOKEN=...` resolve somente o token da conta padrão.

## Relacionados

- [Visão geral dos canais](/pt-BR/channels) - todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) - autenticação de mensagens diretas e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) - comportamento das conversas em grupo e exigência de menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) - roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) - modelo de acesso e proteção
