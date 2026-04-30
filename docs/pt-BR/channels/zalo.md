---
read_when:
    - Trabalhando em recursos ou webhooks do Zalo
summary: Status de suporte, recursos e configuração do bot do Zalo
title: Zalo
x-i18n:
    generated_at: "2026-04-30T09:39:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: e79a4a27accc7f460bd3ae9c01e8f5f80e21a285af5d89b94bb9c89244a4438f
    source_path: channels/zalo.md
    workflow: 16
---

Status: experimental. DMs são compatíveis. A seção [Capacidades](#capabilities) abaixo reflete o comportamento atual dos bots do Marketplace.

## Plugin incluído

O Zalo é fornecido como um Plugin incluído nas versões atuais do OpenClaw, portanto builds empacotados normais
não precisam de uma instalação separada.

Se você está em um build mais antigo ou em uma instalação personalizada que exclui o Zalo, instale um
pacote npm atual quando um for publicado:

- Instalar via CLI: `openclaw plugins install @openclaw/zalo`
- Ou a partir de um checkout do código-fonte: `openclaw plugins install ./path/to/local/zalo-plugin`
- Detalhes: [Plugins](/pt-BR/tools/plugin)

Se o npm informar que o pacote mantido pelo OpenClaw está obsoleto, use um build empacotado
atual do OpenClaw ou o caminho do checkout local até que um pacote npm mais novo seja
publicado.

## Configuração rápida (iniciante)

1. Garanta que o Plugin do Zalo esteja disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações mais antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
2. Defina o token:
   - Env: `ZALO_BOT_TOKEN=...`
   - Ou configuração: `channels.zalo.accounts.default.botToken: "..."`.
3. Reinicie o Gateway (ou conclua a configuração).
4. O acesso por DM usa pareamento por padrão; aprove o código de pareamento no primeiro contato.

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

## O que é

Zalo é um aplicativo de mensagens focado no Vietnã; sua API de Bot permite que o Gateway execute um bot para conversas 1:1.
É uma boa opção para suporte ou notificações quando você quer roteamento determinístico de volta para o Zalo.

Esta página reflete o comportamento atual do OpenClaw para **bots do Zalo Bot Creator / Marketplace**.
**Bots de Conta Oficial (OA) do Zalo** são uma superfície de produto diferente do Zalo e podem se comportar de forma diferente.

- Um canal da API de Bot do Zalo pertencente ao Gateway.
- Roteamento determinístico: as respostas voltam para o Zalo; o modelo nunca escolhe canais.
- DMs compartilham a sessão principal do agente.
- A seção [Capacidades](#capabilities) abaixo mostra o suporte atual a bots do Marketplace.

## Configuração (caminho rápido)

### 1) Crie um token de bot (Zalo Bot Platform)

1. Acesse [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) e entre.
2. Crie um novo bot e configure suas definições.
3. Copie o token completo do bot (normalmente `numeric_id:secret`). Para bots do Marketplace, o token de runtime utilizável pode aparecer na mensagem de boas-vindas do bot após a criação.

### 2) Configure o token (env ou configuração)

Exemplo:

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

Se depois você migrar para uma superfície de bot do Zalo em que grupos estejam disponíveis, poderá adicionar configuração específica de grupo, como `groupPolicy` e `groupAllowFrom`, explicitamente. Para o comportamento atual de bots do Marketplace, consulte [Capacidades](#capabilities).

Opção de env: `ZALO_BOT_TOKEN=...` (funciona apenas para a conta padrão).

Suporte a múltiplas contas: use `channels.zalo.accounts` com tokens por conta e `name` opcional.

3. Reinicie o Gateway. O Zalo inicia quando um token é resolvido (env ou configuração).
4. O acesso por DM usa pareamento por padrão. Aprove o código quando o bot for contatado pela primeira vez.

## Como funciona (comportamento)

- Mensagens recebidas são normalizadas no envelope compartilhado do canal com placeholders de mídia.
- Respostas sempre são roteadas de volta para o mesmo chat do Zalo.
- Long-polling por padrão; modo Webhook disponível com `channels.zalo.webhookUrl`.

## Limites

- Texto enviado é dividido em partes de 2000 caracteres (limite da API do Zalo).
- Downloads/uploads de mídia são limitados por `channels.zalo.mediaMaxMb` (padrão 5).
- Streaming é bloqueado por padrão porque o limite de 2000 caracteres torna o streaming menos útil.

## Controle de acesso (DMs)

### Acesso por DM

- Padrão: `channels.zalo.dmPolicy = "pairing"`. Remetentes desconhecidos recebem um código de pareamento; mensagens são ignoradas até a aprovação (códigos expiram após 1 hora).
- Aprove via:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- O pareamento é a troca de token padrão. Detalhes: [Pareamento](/pt-BR/channels/pairing)
- `channels.zalo.allowFrom` aceita IDs numéricos de usuário (sem consulta de nome de usuário disponível).

## Controle de acesso (grupos)

Para **bots do Zalo Bot Creator / Marketplace**, o suporte a grupos não estava disponível na prática porque o bot não podia ser adicionado a um grupo.

Isso significa que as chaves de configuração relacionadas a grupos abaixo existem no schema, mas não eram utilizáveis para bots do Marketplace:

- `channels.zalo.groupPolicy` controla o tratamento de entrada em grupos: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom` restringe quais IDs de remetente podem acionar o bot em grupos.
- Se `groupAllowFrom` não estiver definido, o Zalo volta a usar `allowFrom` para verificações de remetente.
- Observação de runtime: se `channels.zalo` estiver totalmente ausente, o runtime ainda volta para `groupPolicy="allowlist"` por segurança.

Os valores de política de grupo (quando o acesso a grupos está disponível na superfície do seu bot) são:

- `groupPolicy: "disabled"` — bloqueia todas as mensagens de grupo.
- `groupPolicy: "open"` — permite qualquer membro do grupo (controlado por menção).
- `groupPolicy: "allowlist"` — padrão fechado em falha; apenas remetentes permitidos são aceitos.

Se você está usando uma superfície de produto de bot do Zalo diferente e verificou comportamento de grupo funcional, documente isso separadamente em vez de presumir que corresponde ao fluxo de bots do Marketplace.

## Long-polling vs Webhook

- Padrão: long-polling (nenhuma URL pública necessária).
- Modo Webhook: defina `channels.zalo.webhookUrl` e `channels.zalo.webhookSecret`.
  - O segredo do Webhook deve ter de 8 a 256 caracteres.
  - A URL do Webhook deve usar HTTPS.
  - O Zalo envia eventos com o cabeçalho `X-Bot-Api-Secret-Token` para verificação.
  - O HTTP do Gateway processa solicitações de Webhook em `channels.zalo.webhookPath` (por padrão, o caminho da URL do Webhook).
  - As solicitações devem usar `Content-Type: application/json` (ou tipos de mídia `+json`).
  - Eventos duplicados (`event_name + message_id`) são ignorados por uma janela curta de replay.
  - Tráfego em rajada tem limite de taxa por caminho/origem e pode retornar HTTP 429.

**Observação:** getUpdates (polling) e Webhook são mutuamente exclusivos segundo a documentação da API do Zalo.

## Tipos de mensagem compatíveis

Para um resumo rápido de suporte, consulte [Capacidades](#capabilities). As observações abaixo adicionam detalhes quando o comportamento precisa de contexto extra.

- **Mensagens de texto**: Suporte completo com divisão em partes de 2000 caracteres.
- **URLs simples no texto**: Comportam-se como entrada de texto normal.
- **Pré-visualizações de link / cartões de link avançados**: Consulte o status de bots do Marketplace em [Capacidades](#capabilities); eles não acionavam uma resposta de forma confiável.
- **Mensagens de imagem**: Consulte o status de bots do Marketplace em [Capacidades](#capabilities); o tratamento de imagens recebidas era instável (indicador de digitação sem resposta final).
- **Figurinhas**: Consulte o status de bots do Marketplace em [Capacidades](#capabilities).
- **Notas de voz / arquivos de áudio / vídeo / anexos de arquivo genéricos**: Consulte o status de bots do Marketplace em [Capacidades](#capabilities).
- **Tipos incompatíveis**: Registrados em log (por exemplo, mensagens de usuários protegidos).

## Capacidades

Esta tabela resume o comportamento atual de **bots do Zalo Bot Creator / Marketplace** no OpenClaw.

| Recurso                     | Status                                             |
| --------------------------- | -------------------------------------------------- |
| Mensagens diretas           | ✅ Compatível                                      |
| Grupos                      | ❌ Não disponível para bots do Marketplace         |
| Mídia (imagens recebidas)   | ⚠️ Limitado / verifique no seu ambiente            |
| Mídia (imagens enviadas)    | ⚠️ Não retestado para bots do Marketplace          |
| URLs simples no texto       | ✅ Compatível                                      |
| Pré-visualizações de link   | ⚠️ Instáveis para bots do Marketplace              |
| Reações                     | ❌ Não compatível                                  |
| Figurinhas                  | ⚠️ Sem resposta do agente para bots do Marketplace |
| Notas de voz / áudio / vídeo | ⚠️ Sem resposta do agente para bots do Marketplace |
| Anexos de arquivo           | ⚠️ Sem resposta do agente para bots do Marketplace |
| Threads                     | ❌ Não compatível                                  |
| Enquetes                    | ❌ Não compatível                                  |
| Comandos nativos            | ❌ Não compatível                                  |
| Streaming                   | ⚠️ Bloqueado (limite de 2000 caracteres)           |

## Destinos de entrega (CLI/cron)

- Use um id de chat como destino.
- Exemplo: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Solução de problemas

**O bot não responde:**

- Verifique se o token é válido: `openclaw channels status --probe`
- Verifique se o remetente está aprovado (pareamento ou allowFrom)
- Verifique os logs do Gateway: `openclaw logs --follow`

**Webhook não recebe eventos:**

- Garanta que a URL do Webhook use HTTPS
- Verifique se o token secreto tem de 8 a 256 caracteres
- Confirme que o endpoint HTTP do Gateway está acessível no caminho configurado
- Verifique se o polling getUpdates não está em execução (eles são mutuamente exclusivos)

## Referência de configuração (Zalo)

Configuração completa: [Configuração](/pt-BR/gateway/configuration)

As chaves planas de nível superior (`channels.zalo.botToken`, `channels.zalo.dmPolicy` e semelhantes) são um atalho legado de conta única. Prefira `channels.zalo.accounts.<id>.*` para novas configurações. Ambas as formas ainda são documentadas aqui porque existem no schema.

Opções do provedor:

- `channels.zalo.enabled`: habilita/desabilita a inicialização do canal.
- `channels.zalo.botToken`: token do bot da Zalo Bot Platform.
- `channels.zalo.tokenFile`: lê o token de um caminho de arquivo regular. Symlinks são rejeitados.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: pairing).
- `channels.zalo.allowFrom`: allowlist de DM (IDs de usuário). `open` exige `"*"`. O assistente perguntará por IDs numéricos.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (padrão: allowlist). Presente na configuração; consulte [Capacidades](#capabilities) e [Controle de acesso (grupos)](#access-control-groups) para o comportamento atual de bots do Marketplace.
- `channels.zalo.groupAllowFrom`: allowlist de remetentes de grupo (IDs de usuário). Volta para `allowFrom` quando não definido.
- `channels.zalo.mediaMaxMb`: limite de mídia recebida/enviada (MB, padrão 5).
- `channels.zalo.webhookUrl`: habilita o modo Webhook (HTTPS obrigatório).
- `channels.zalo.webhookSecret`: segredo do Webhook (8-256 caracteres).
- `channels.zalo.webhookPath`: caminho do Webhook no servidor HTTP do Gateway.
- `channels.zalo.proxy`: URL de proxy para solicitações de API.

Opções de múltiplas contas:

- `channels.zalo.accounts.<id>.botToken`: token por conta.
- `channels.zalo.accounts.<id>.tokenFile`: arquivo regular de token por conta. Symlinks são rejeitados.
- `channels.zalo.accounts.<id>.name`: nome de exibição.
- `channels.zalo.accounts.<id>.enabled`: habilita/desabilita a conta.
- `channels.zalo.accounts.<id>.dmPolicy`: política de DM por conta.
- `channels.zalo.accounts.<id>.allowFrom`: allowlist por conta.
- `channels.zalo.accounts.<id>.groupPolicy`: política de grupo por conta. Presente na configuração; consulte [Capacidades](#capabilities) e [Controle de acesso (grupos)](#access-control-groups) para o comportamento atual de bots do Marketplace.
- `channels.zalo.accounts.<id>.groupAllowFrom`: allowlist de remetentes de grupo por conta.
- `channels.zalo.accounts.<id>.webhookUrl`: URL de Webhook por conta.
- `channels.zalo.accounts.<id>.webhookSecret`: segredo de Webhook por conta.
- `channels.zalo.accounts.<id>.webhookPath`: caminho de Webhook por conta.
- `channels.zalo.accounts.<id>.proxy`: URL de proxy por conta.

## Relacionados

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação por DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e controle por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e hardening
