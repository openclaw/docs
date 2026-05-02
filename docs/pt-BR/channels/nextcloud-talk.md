---
read_when:
    - Trabalhando nos recursos do canal Nextcloud Talk
summary: Status de suporte, recursos e configuração do Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-05-02T22:16:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4956586ae8622118dcf136f4279c6ed1c2895fd4bb4576a7f5799de600a95740
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Status: Plugin incluído (bot de Webhook). Mensagens diretas, salas, reações e mensagens em markdown são compatíveis.

## Plugin incluído

O Nextcloud Talk é distribuído como um Plugin incluído nas versões atuais do OpenClaw, portanto
builds empacotados normais não precisam de uma instalação separada.

Se você estiver usando um build mais antigo ou uma instalação personalizada que exclui o Nextcloud Talk,
instale o pacote npm diretamente:

Instale via CLI (registro npm):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Use o pacote sem versão para acompanhar a tag de versão oficial atual. Fixe uma versão
exata somente quando precisar de uma instalação reproduzível.

Checkout local (ao executar a partir de um repositório git):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração rápida (iniciante)

1. Certifique-se de que o Plugin Nextcloud Talk esteja disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações mais antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
2. No seu servidor Nextcloud, crie um bot:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. Ative o bot nas configurações da sala de destino.
4. Configure o OpenClaw:
   - Configuração: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Ou variável de ambiente: `NEXTCLOUD_TALK_BOT_SECRET` (somente conta padrão)

   Configuração pela CLI:

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

5. Reinicie o Gateway (ou conclua a configuração).

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

- Bots não podem iniciar DMs. O usuário precisa enviar uma mensagem ao bot primeiro.
- A URL do Webhook deve ser acessível pelo Gateway; defina `webhookPublicUrl` se estiver atrás de um proxy.
- Uploads de mídia não são compatíveis com a API do bot; a mídia é enviada como URLs.
- A carga útil do Webhook não diferencia DMs de salas; defina `apiUser` + `apiPassword` para habilitar consultas de tipo de sala (caso contrário, DMs são tratadas como salas).

## Controle de acesso (DMs)

- Padrão: `channels.nextcloud-talk.dmPolicy = "pairing"`. Remetentes desconhecidos recebem um código de pareamento.
- Aprove via:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- DMs públicas: `channels.nextcloud-talk.dmPolicy="open"` mais `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` corresponde apenas a IDs de usuário do Nextcloud; nomes de exibição são ignorados.

## Salas (grupos)

- Padrão: `channels.nextcloud-talk.groupPolicy = "allowlist"` (controlado por menção).
- Adicione salas à lista de permissões com `channels.nextcloud-talk.rooms`:

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

## Recursos

| Recurso           | Status          |
| ----------------- | --------------- |
| Mensagens diretas | Compatível      |
| Salas             | Compatível      |
| Threads           | Não compatível  |
| Mídia             | somente URL     |
| Reações           | Compatível      |
| Comandos nativos  | Não compatível  |

## Referência de configuração (Nextcloud Talk)

Configuração completa: [Configuração](/pt-BR/gateway/configuration)

Opções do provedor:

- `channels.nextcloud-talk.enabled`: habilitar/desabilitar a inicialização do canal.
- `channels.nextcloud-talk.baseUrl`: URL da instância Nextcloud.
- `channels.nextcloud-talk.botSecret`: segredo compartilhado do bot.
- `channels.nextcloud-talk.botSecretFile`: caminho de segredo para arquivo regular. Links simbólicos são rejeitados.
- `channels.nextcloud-talk.apiUser`: usuário da API para buscas de sala (detecção de DM).
- `channels.nextcloud-talk.apiPassword`: senha de API/app para buscas de sala.
- `channels.nextcloud-talk.apiPasswordFile`: caminho do arquivo de senha da API.
- `channels.nextcloud-talk.webhookPort`: porta do ouvinte de Webhook (padrão: 8788).
- `channels.nextcloud-talk.webhookHost`: host do Webhook (padrão: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: caminho do Webhook (padrão: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL de Webhook acessível externamente.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: lista de permissões de DM (IDs de usuário). `open` requer `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: lista de permissões de grupo (IDs de usuário).
- `channels.nextcloud-talk.rooms`: configurações por sala e lista de permissões.
- `channels.nextcloud-talk.historyLimit`: limite de histórico de grupo (0 desabilita).
- `channels.nextcloud-talk.dmHistoryLimit`: limite de histórico de DM (0 desabilita).
- `channels.nextcloud-talk.dms`: substituições por DM (historyLimit).
- `channels.nextcloud-talk.textChunkLimit`: tamanho do bloco de texto de saída (caracteres).
- `channels.nextcloud-talk.chunkMode`: `length` (padrão) ou `newline` para dividir em linhas em branco (limites de parágrafo) antes da divisão por comprimento.
- `channels.nextcloud-talk.blockStreaming`: desabilitar streaming de blocos para este canal.
- `channels.nextcloud-talk.blockStreamingCoalesce`: ajuste de coalescência do streaming de blocos.
- `channels.nextcloud-talk.mediaMaxMb`: limite de mídia de entrada (MB).

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação de DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e controle de menções
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e fortalecimento
