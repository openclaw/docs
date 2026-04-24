---
read_when:
    - Você quer que o OpenClaw receba DMs via Nostr
    - Você está configurando mensagens descentralizadas
summary: Canal de DM do Nostr por meio de mensagens criptografadas NIP-04
title: Nostr
x-i18n:
    generated_at: "2026-04-24T05:42:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f722bb4e1c5f2b3a9c1d58f5597aad2826a809cba3d165af7bf2faf72b68a0f
    source_path: channels/nostr.md
    workflow: 15
---

**Status:** Plugin incluído opcional (desabilitado por padrão até ser configurado).

Nostr é um protocolo descentralizado para redes sociais. Este canal permite que o OpenClaw receba e responda a mensagens diretas (DMs) criptografadas por meio do NIP-04.

## Plugin incluído

As versões atuais do OpenClaw incluem o Nostr como um Plugin incluído, então compilações empacotadas
normais não precisam de uma instalação separada.

### Instalações antigas/personalizadas

- O onboarding (`openclaw onboard`) e `openclaw channels add` ainda exibem
  o Nostr a partir do catálogo compartilhado de canais.
- Se a sua compilação excluir o Nostr incluído, instale-o manualmente.

```bash
openclaw plugins install @openclaw/nostr
```

Use um checkout local (fluxos de desenvolvimento):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Reinicie o Gateway após instalar ou habilitar Plugins.

### Configuração não interativa

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Use `--use-env` para manter `NOSTR_PRIVATE_KEY` no ambiente em vez de armazenar a chave na configuração.

## Configuração rápida

1. Gere um par de chaves do Nostr (se necessário):

```bash
# Usando nak
nak key generate
```

2. Adicione à configuração:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
    },
  },
}
```

3. Exporte a chave:

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. Reinicie o Gateway.

## Referência de configuração

| Chave        | Tipo     | Padrão                                      | Descrição                            |
| ------------ | -------- | ------------------------------------------- | ------------------------------------ |
| `privateKey` | string   | obrigatório                                 | Chave privada no formato `nsec` ou hex |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | URLs dos relays (WebSocket)          |
| `dmPolicy`   | string   | `pairing`                                   | Política de acesso para DM           |
| `allowFrom`  | string[] | `[]`                                        | Chaves públicas permitidas do remetente |
| `enabled`    | boolean  | `true`                                      | Habilitar/desabilitar canal          |
| `name`       | string   | -                                           | Nome de exibição                     |
| `profile`    | object   | -                                           | Metadados de perfil NIP-01           |

## Metadados de perfil

Os dados do perfil são publicados como um evento NIP-01 `kind:0`. Você pode gerenciá-los pela UI de controle (Canais -> Nostr -> Perfil) ou defini-los diretamente na configuração.

Exemplo:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Bot de DM de assistente pessoal",
        picture: "https://example.com/avatar.png",
        banner: "https://example.com/banner.png",
        website: "https://example.com",
        nip05: "openclaw@example.com",
        lud16: "openclaw@example.com",
      },
    },
  },
}
```

Observações:

- As URLs do perfil devem usar `https://`.
- A importação de relays mescla campos e preserva substituições locais.

## Controle de acesso

### Políticas de DM

- **pairing** (padrão): remetentes desconhecidos recebem um código de pairing.
- **allowlist**: somente chaves públicas em `allowFrom` podem enviar DMs.
- **open**: DMs públicas de entrada (requer `allowFrom: ["*"]`).
- **disabled**: ignora DMs de entrada.

Observações sobre a aplicação:

- As assinaturas de eventos de entrada são verificadas antes da política do remetente e da descriptografia NIP-04, então eventos forjados são rejeitados cedo.
- As respostas de pairing são enviadas sem processar o corpo original da DM.
- DMs de entrada são limitadas por taxa, e cargas úteis grandes demais são descartadas antes da descriptografia.

### Exemplo de lista de permissão

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      dmPolicy: "allowlist",
      allowFrom: ["npub1abc...", "npub1xyz..."],
    },
  },
}
```

## Formatos de chave

Formatos aceitos:

- **Chave privada:** `nsec...` ou hex com 64 caracteres
- **Chaves públicas (`allowFrom`):** `npub...` ou hex

## Relays

Padrões: `relay.damus.io` e `nos.lol`.

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["wss://relay.damus.io", "wss://relay.primal.net", "wss://nostr.wine"],
    },
  },
}
```

Dicas:

- Use 2-3 relays para redundância.
- Evite relays demais (latência, duplicação).
- Relays pagos podem melhorar a confiabilidade.
- Relays locais são adequados para testes (`ws://localhost:7777`).

## Suporte ao protocolo

| NIP    | Status        | Descrição                              |
| ------ | ------------- | -------------------------------------- |
| NIP-01 | Compatível    | Formato básico de evento + metadados de perfil |
| NIP-04 | Compatível    | DMs criptografadas (`kind:4`)          |
| NIP-17 | Planejado     | DMs com gift-wrap                      |
| NIP-44 | Planejado     | Criptografia versionada                |

## Testes

### Relay local

```bash
# Iniciar strfry
docker run -p 7777:7777 ghcr.io/hoytech/strfry
```

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["ws://localhost:7777"],
    },
  },
}
```

### Teste manual

1. Anote a chave pública do bot (npub) nos logs.
2. Abra um cliente Nostr (Damus, Amethyst etc.).
3. Envie uma DM para a chave pública do bot.
4. Verifique a resposta.

## Solução de problemas

### Não está recebendo mensagens

- Verifique se a chave privada é válida.
- Certifique-se de que as URLs dos relays estão acessíveis e usam `wss://` (ou `ws://` para local).
- Confirme que `enabled` não está como `false`.
- Verifique os logs do Gateway para erros de conexão com relays.

### Não está enviando respostas

- Verifique se o relay aceita gravações.
- Verifique a conectividade de saída.
- Observe possíveis limites de taxa do relay.

### Respostas duplicadas

- Esperado ao usar múltiplos relays.
- As mensagens são desduplicadas por ID de evento; apenas a primeira entrega aciona uma resposta.

## Segurança

- Nunca faça commit de chaves privadas.
- Use variáveis de ambiente para as chaves.
- Considere `allowlist` para bots de produção.
- As assinaturas são verificadas antes da política do remetente, e a política do remetente é aplicada antes da descriptografia, então eventos forjados são rejeitados cedo e remetentes desconhecidos não podem forçar trabalho criptográfico completo.

## Limitações (MVP)

- Somente mensagens diretas (sem chats em grupo).
- Sem anexos de mídia.
- Somente NIP-04 (gift-wrap NIP-17 planejado).

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pairing](/pt-BR/channels/pairing) — autenticação de DM e fluxo de pairing
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e controle por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e proteção
