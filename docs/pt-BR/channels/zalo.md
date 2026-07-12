---
read_when:
    - Trabalhando em recursos ou webhooks do Zalo
summary: Status, recursos e configuração do bot do Zalo
title: Zalo
x-i18n:
    generated_at: "2026-07-11T23:45:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 36e624f1abeeaee56d7376b9df9209f8e7614ade2f089bcecd76ff746b942765
    source_path: channels/zalo.md
    workflow: 16
---

Status: experimental. Mensagens diretas e conversas em grupo estão implementadas; a tabela de [Recursos](#capabilities) abaixo reflete o comportamento verificado em bots do Zalo Bot Creator / Marketplace.

## Plugin incluído

O Zalo é distribuído como um Plugin incluído nas versões atuais do OpenClaw, portanto, builds empacotados não precisam de uma instalação separada.

Em um build mais antigo ou em uma instalação personalizada que exclua o Zalo, instale o pacote npm diretamente:

- Instalar: `openclaw plugins install @openclaw/zalo`
- Versão fixada: `openclaw plugins install @openclaw/zalo@2026.6.11`
- De um checkout local: `openclaw plugins install ./path/to/local/zalo-plugin`
- Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração rápida

1. Crie um token de bot em [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) (entre na conta, crie um bot e defina as configurações). O token tem o formato `numeric_id:secret`; para bots do Marketplace, o token utilizável em tempo de execução pode aparecer na mensagem de boas-vindas do bot.
2. Defina o token como a variável de ambiente `ZALO_BOT_TOKEN=...` (somente para a conta padrão) ou na configuração.
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

Várias contas: adicione mais entradas em `channels.zalo.accounts.<id>`, cada uma com seu próprio `botToken`/`name`. `channels.zalo.botToken` (estrutura simples, sem `accounts`) é uma forma abreviada legada para uma única conta; prefira `accounts.<id>.*` em novas configurações.

## O que é

O Zalo é um aplicativo de mensagens voltado ao Vietnã. Sua API de bots permite que o Gateway execute um bot tanto em conversas individuais quanto em conversas em grupo, com roteamento determinístico de volta ao Zalo (o modelo nunca escolhe os canais).

Esta página aborda **bots do Zalo Bot Creator / Marketplace**. Os **bots de Conta Oficial (OA) do Zalo** pertencem a uma superfície de produto diferente e podem se comportar de forma distinta; esta página não os aborda.

## Como funciona

- As mensagens recebidas são normalizadas no envelope compartilhado do canal, com espaços reservados para mídia.
- As respostas sempre são roteadas de volta à mesma conversa do Zalo; respostas com citação não são usadas (`replyToMode` permanece desativado).
- Por padrão, usa sondagem longa (`getUpdates`); o modo Webhook está disponível por meio de `channels.zalo.webhookUrl`.
- Em grupos, é necessário mencionar o bot com @ para acioná-lo; isso não pode ser configurado por canal.

## Limites

| Limite                                  | Valor                                                                                  |
| --------------------------------------- | -------------------------------------------------------------------------------------- |
| Tamanho do bloco de texto enviado       | 2.000 caracteres (limite da API do Zalo)                                               |
| Tamanho da mídia (recebida/enviada)     | `channels.zalo.mediaMaxMb`, padrão de `5` MB                                           |
| Corpo da solicitação de Webhook         | 1 MB, tempo limite de leitura de 30 s                                                  |
| Limite de taxa do Webhook               | 120 solicitações / 60 s por caminho+IP do cliente; depois disso, HTTP 429              |
| Janela de eventos duplicados do Webhook | 5 minutos (chave por caminho + conta + nome do evento + conversa + remetente + ID da mensagem) |

## Controle de acesso

### Mensagens diretas

- `channels.zalo.dmPolicy`: `pairing` (padrão) | `allowlist` | `open` | `disabled`.
- Pareamento: remetentes desconhecidos recebem um código de pareamento; as mensagens são ignoradas até a aprovação. Os códigos expiram após 1 hora.
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
  - Detalhes: [Pareamento](/pt-BR/channels/pairing)
- `channels.zalo.allowFrom` aceita IDs numéricos de usuários do Zalo (sem consulta por nome de usuário). `open` exige `"*"`.

### Grupos

As conversas em grupo são compatíveis com o Plugin (`chatTypes: ["direct", "group"]`) e são controladas pela menção e pela política de grupos:

- `channels.zalo.groupPolicy`: `open` | `allowlist` | `disabled`.
- `channels.zalo.groupAllowFrom` restringe quais IDs de remetentes podem acionar o bot em grupos; quando não definido, usa `allowFrom`.
- Resolução padrão: quando `channels.zalo` está configurado, um `groupPolicy` não definido é resolvido como `open`. Quando `channels.zalo` está completamente ausente, o tempo de execução aplica `allowlist` como opção segura.
- Ressalva relatada em uso real: em algumas configurações de bots do Marketplace, não foi possível adicionar o bot a nenhum grupo. Se isso acontecer, verifique as configurações do seu bot na Zalo Bot Platform; trata-se de uma restrição da plataforma, não de uma política do OpenClaw.

## Sondagem longa versus Webhook

- Padrão: sondagem longa (não requer URL pública).
- Modo Webhook: defina `channels.zalo.webhookUrl` e `channels.zalo.webhookSecret`.
  - A URL do Webhook deve usar HTTPS.
  - O segredo do Webhook deve ter entre 8 e 256 caracteres.
  - O Zalo envia eventos com um cabeçalho `X-Bot-Api-Secret-Token`, verificado por meio de uma comparação em tempo constante.
  - O HTTP do Gateway processa as solicitações de Webhook em `channels.zalo.webhookPath` (o padrão é o caminho da URL do Webhook).
  - As solicitações devem usar `Content-Type: application/json` (ou um tipo de mídia `+json`).
  - A sondagem por `getUpdates` e o Webhook são mutuamente exclusivos, conforme a documentação da API do Zalo.

## Tipos de mensagem compatíveis

- Texto: compatibilidade total, dividido em blocos de 2.000 caracteres.
- Mídia: recebimento e envio, limitados por `mediaMaxMb`.
- Reações, tópicos, enquetes e comandos nativos: não são compatíveis com o Plugin.
- Transmissão contínua: o Plugin declara o recurso de transmissão em blocos, mas o Zalo não possui opções específicas para ajustar a fila de envio ou a mesclagem de texto (ao contrário de alguns outros canais regionais); verifique o comportamento atual no seu ambiente se isso for importante para seu caso de uso.

## Recursos

| Recurso                  | Status                                      |
| ------------------------ | ------------------------------------------- |
| Mensagens diretas        | Compatível                                  |
| Grupos                   | Compatível (exige menção)                   |
| Mídia (recebida/enviada) | Compatível, limitada por `mediaMaxMb`       |
| Reações                  | Não compatível                              |
| Tópicos                  | Não compatível                              |
| Enquetes                 | Não compatível                              |
| Comandos nativos         | Não compatível                              |
| Resposta a / citação     | Não utilizada (permanece desativada)        |

## Destinos de entrega (CLI/Cron)

Use um ID de conversa como destino:

```bash
openclaw message send --channel zalo --target 123456789 --message "hi"
```

## Solução de problemas

**O bot não responde:**

- Verifique o token: `openclaw channels status --probe`
- Verifique se o remetente está aprovado (pareamento ou `allowFrom`)
- Verifique os logs do Gateway: `openclaw logs --follow`

**O Webhook não está recebendo eventos:**

- Confirme que a URL do Webhook usa HTTPS
- Confirme que o segredo tem entre 8 e 256 caracteres
- Confirme que o endpoint HTTP do Gateway está acessível no caminho configurado
- Confirme que a sondagem por `getUpdates` também não está em execução (eles são mutuamente exclusivos)
- Uma rajada de solicitações pode retornar HTTP 429 (120 solicitações / 60 s por caminho+IP); aguarde e tente novamente

## Referência de configuração

Configuração completa: [Configuração](/pt-BR/gateway/configuration)

| Configuração                                  | Descrição                                                      | Padrão                 |
| --------------------------------------------- | -------------------------------------------------------------- | ---------------------- |
| `channels.zalo.enabled`                       | Ativa/desativa a inicialização do canal                        | `true`                 |
| `channels.zalo.accounts.<id>.botToken`        | Token do bot obtido na Zalo Bot Platform                       | -                      |
| `channels.zalo.accounts.<id>.tokenFile`       | Lê o token de um arquivo (links simbólicos são rejeitados)     | -                      |
| `channels.zalo.accounts.<id>.name`            | Nome de exibição                                                | -                      |
| `channels.zalo.accounts.<id>.enabled`         | Ativa/desativa esta conta                                     | `true`                 |
| `channels.zalo.accounts.<id>.dmPolicy`        | Política de mensagens diretas por conta                        | `pairing`              |
| `channels.zalo.accounts.<id>.allowFrom`       | Lista de permissões para mensagens diretas (IDs de usuários)   | -                      |
| `channels.zalo.accounts.<id>.groupPolicy`     | Política de grupos por conta                                   | consulte [Grupos](#groups) |
| `channels.zalo.accounts.<id>.groupAllowFrom`  | Lista de remetentes permitidos em grupos; usa `allowFrom` como alternativa | -             |
| `channels.zalo.accounts.<id>.mediaMaxMb`      | Limite de mídia recebida/enviada (MB)                           | `5`                    |
| `channels.zalo.accounts.<id>.webhookUrl`      | Ativa o modo Webhook (HTTPS obrigatório)                       | -                      |
| `channels.zalo.accounts.<id>.webhookSecret`   | Segredo do Webhook (8 a 256 caracteres)                        | -                      |
| `channels.zalo.accounts.<id>.webhookPath`     | Caminho do Webhook no servidor HTTP do Gateway                 | caminho da URL do Webhook |
| `channels.zalo.accounts.<id>.proxy`           | URL do proxy para solicitações à API                           | -                      |
| `channels.zalo.accounts.<id>.responsePrefix`  | Substituição do prefixo das respostas enviadas                 | -                      |
| `channels.zalo.defaultAccount`                | Conta padrão quando várias estão configuradas                  | `default`              |

`channels.zalo.botToken`, `channels.zalo.dmPolicy` e outras chaves simples de nível superior são formas abreviadas legadas para uma única conta correspondentes aos campos acima; ambas as formas são compatíveis.

Opção de ambiente: `ZALO_BOT_TOKEN=...` resolve somente o token da conta padrão.

## Relacionados

- [Visão geral dos canais](/pt-BR/channels) - todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) - autenticação de mensagens diretas e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) - comportamento de conversas em grupo e exigência de menções
- [Roteamento de canais](/pt-BR/channels/channel-routing) - roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) - modelo de acesso e proteção
