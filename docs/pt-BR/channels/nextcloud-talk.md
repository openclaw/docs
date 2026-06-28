---
read_when:
    - Trabalhando em recursos do canal Nextcloud Talk
summary: Status de suporte, recursos e configuração do Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-05-10T19:22:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: e4b3b2d074cc8d3c19223dbb0c306c6861717d0f35e638e3aab04b03647fd248
    source_path: channels/nextcloud-talk.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Status: plugin integrado (bot de Webhook). Mensagens diretas, salas, reações e mensagens em markdown são compatíveis.

## Plugin integrado

O Nextcloud Talk é distribuído como um plugin integrado nas versões atuais do OpenClaw, portanto
builds empacotados normais não precisam de uma instalação separada.

Se você estiver em um build mais antigo ou em uma instalação personalizada que exclui o Nextcloud Talk,
instale o pacote npm diretamente:

Instalar via CLI (registro npm):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Use o pacote sem versão para seguir a tag de lançamento oficial atual. Fixe uma versão
exata somente quando precisar de uma instalação reproduzível.

Checkout local (ao executar a partir de um repositório git):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração rápida (iniciante)

1. Garanta que o plugin Nextcloud Talk esteja disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações mais antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
2. No seu servidor Nextcloud, crie um bot:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

3. Habilite o bot nas configurações da sala de destino.
4. Configure o OpenClaw:
   - Configuração: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Ou env: `NEXTCLOUD_TALK_BOT_SECRET` (somente conta padrão)

   Configuração via CLI:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   Campos explícitos equivalentes:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   Segredo baseado em arquivo:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. Reinicie o Gateway (ou finalize a configuração).

Configuração mínima:

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## Observações

- Bots não podem iniciar DMs. O usuário deve enviar uma mensagem ao bot primeiro.
- A URL do Webhook deve ser acessível pelo Gateway; defina `webhookPublicUrl` se estiver atrás de um proxy.
- Uploads de mídia não são compatíveis com a API do bot; a mídia é enviada como URLs.
- A carga útil do Webhook não diferencia DMs de salas; defina `apiUser` + `apiPassword` para habilitar consultas de tipo de sala (caso contrário, DMs são tratadas como salas).

## Controle de acesso (DMs)

- Padrão: `channels.nextcloud-talk.dmPolicy = "pairing"`. Remetentes desconhecidos recebem um código de pareamento.
- Aprovar via:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- DMs públicas: `channels.nextcloud-talk.dmPolicy="open"` mais `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` corresponde apenas a IDs de usuário do Nextcloud; nomes de exibição são ignorados.

## Salas (grupos)

- Padrão: `channels.nextcloud-talk.groupPolicy = "allowlist"` (controlado por menção).
- Coloque salas na lista de permissões com `channels.nextcloud-talk.rooms`:

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- Para não permitir nenhuma sala, mantenha a lista de permissões vazia ou defina `channels.nextcloud-talk.groupPolicy="disabled"`.

## Capacidades

| Recurso          | Status              |
| ---------------- | ------------------- |
| Mensagens diretas | Compatível          |
| Salas            | Compatível          |
| Threads          | Não compatível      |
| Mídia            | Somente URL         |
| Reações          | Compatível          |
| Comandos nativos | Não compatível      |

## Referência de configuração (Nextcloud Talk)

Configuração completa: [Configuração](/pt-BR/gateway/configuration)

Opções do provedor:

- `channels.nextcloud-talk.enabled`: habilitar/desabilitar a inicialização do canal.
- `channels.nextcloud-talk.baseUrl`: URL da instância Nextcloud.
- `channels.nextcloud-talk.botSecret`: segredo compartilhado do bot.
- `channels.nextcloud-talk.botSecretFile`: caminho do segredo em arquivo regular. Symlinks são rejeitados.
- `channels.nextcloud-talk.apiUser`: usuário da API para consultas de sala (detecção de DM).
- `channels.nextcloud-talk.apiPassword`: senha da API/app para consultas de sala.
- `channels.nextcloud-talk.apiPasswordFile`: caminho do arquivo de senha da API.
- `channels.nextcloud-talk.webhookPort`: porta do listener de Webhook (padrão: 8788).
- `channels.nextcloud-talk.webhookHost`: host do Webhook (padrão: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: caminho do Webhook (padrão: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL do Webhook acessível externamente.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: lista de permissões de DM (IDs de usuário). `open` exige `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: lista de permissões de grupo (IDs de usuário).
- `channels.nextcloud-talk.rooms`: configurações por sala e lista de permissões.
- Grupos estáticos de acesso de remetente podem ser referenciados em `allowFrom` e `groupAllowFrom` com `accessGroup:<name>`.
- `channels.nextcloud-talk.historyLimit`: limite do histórico de grupo (0 desabilita).
- `channels.nextcloud-talk.dmHistoryLimit`: limite do histórico de DM (0 desabilita).
- `channels.nextcloud-talk.dms`: substituições por DM (historyLimit).
- `channels.nextcloud-talk.textChunkLimit`: tamanho do bloco de texto de saída (caracteres).
- `channels.nextcloud-talk.chunkMode`: `length` (padrão) ou `newline` para dividir em linhas em branco (limites de parágrafo) antes da divisão por comprimento.
- `channels.nextcloud-talk.blockStreaming`: desabilitar streaming de blocos para este canal.
- `channels.nextcloud-talk.blockStreamingCoalesce`: ajuste de coalescência de streaming de blocos.
- `channels.nextcloud-talk.mediaMaxMb`: limite de mídia de entrada (MB).

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação de DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e controle por menção
- [Roteamento de canal](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e hardening
