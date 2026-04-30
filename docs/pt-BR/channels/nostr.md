---
read_when:
    - Você quer que o OpenClaw receba mensagens diretas via Nostr
    - Você está configurando a troca de mensagens descentralizada
summary: Canal de mensagens diretas do Nostr via mensagens criptografadas NIP-04
title: Nostr
x-i18n:
    generated_at: "2026-04-30T09:37:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 545d68077c9fe81d5fa5a17262d37e3688185a1fb12d67b8b1053b27b96c3c7f
    source_path: channels/nostr.md
    workflow: 16
---

**Status:** Plugin incluído opcional (desabilitado por padrão até ser configurado).

Nostr é um protocolo descentralizado para redes sociais. Este canal permite que o OpenClaw receba e responda a mensagens diretas (DMs) criptografadas via NIP-04.

## Plugin incluído

As versões atuais do OpenClaw distribuem o Nostr como um Plugin incluído, portanto builds
empacotados normais não precisam de uma instalação separada.

### Instalações antigas/personalizadas

- O onboarding (`openclaw onboard`) e `openclaw channels add` ainda exibem
  Nostr a partir do catálogo compartilhado de canais.
- Se seu build excluir o Nostr incluído, instale um pacote npm atual quando um
  for publicado.

```bash
openclaw plugins install @openclaw/nostr
```

Se o npm relatar que o pacote pertencente ao OpenClaw foi descontinuado, use um build
empacotado atual do OpenClaw ou um checkout local até que um pacote npm mais novo seja publicado.

Use um checkout local (fluxos de trabalho de desenvolvimento):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Reinicie o Gateway depois de instalar ou habilitar plugins.

### Configuração não interativa

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Use `--use-env` para manter `NOSTR_PRIVATE_KEY` no ambiente em vez de armazenar a chave na configuração.

## Configuração rápida

1. Gere um par de chaves Nostr (se necessário):

```bash
# Using nak
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

| Chave        | Tipo     | Padrão                                     | Descrição                              |
| ------------ | -------- | ------------------------------------------ | -------------------------------------- |
| `privateKey` | string   | obrigatório                                | Chave privada em formato `nsec` ou hex |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | URLs de relays (WebSocket)             |
| `dmPolicy`   | string   | `pairing`                                  | Política de acesso a DMs               |
| `allowFrom`  | string[] | `[]`                                       | Pubkeys de remetentes permitidos       |
| `enabled`    | boolean  | `true`                                     | Habilitar/desabilitar canal            |
| `name`       | string   | -                                          | Nome de exibição                       |
| `profile`    | object   | -                                          | Metadados de perfil NIP-01             |

## Metadados de perfil

Os dados de perfil são publicados como um evento NIP-01 `kind:0`. Você pode gerenciá-los pela Control UI (Channels -> Nostr -> Profile) ou defini-los diretamente na configuração.

Exemplo:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Personal assistant DM bot",
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

Notas:

- URLs de perfil devem usar `https://`.
- A importação a partir de relays mescla campos e preserva substituições locais.

## Controle de acesso

### Políticas de DM

- **pairing** (padrão): remetentes desconhecidos recebem um código de pareamento.
- **allowlist**: somente pubkeys em `allowFrom` podem enviar DMs.
- **open**: DMs públicas de entrada (requer `allowFrom: ["*"]`).
- **disabled**: ignorar DMs de entrada.

Notas de aplicação:

- As assinaturas de eventos de entrada são verificadas antes da política de remetente e da descriptografia NIP-04, portanto eventos falsificados são rejeitados cedo.
- Respostas de pareamento são enviadas sem processar o corpo da DM original.
- DMs de entrada têm limite de taxa e cargas úteis grandes demais são descartadas antes da descriptografia.

### Exemplo de allowlist

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

- **Chave privada:** `nsec...` ou hex de 64 caracteres
- **Pubkeys (`allowFrom`):** `npub...` ou hex

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

- Use 2 a 3 relays para redundância.
- Evite relays em excesso (latência, duplicação).
- Relays pagos podem melhorar a confiabilidade.
- Relays locais são bons para testes (`ws://localhost:7777`).

## Suporte a protocolo

| NIP    | Status       | Descrição                                  |
| ------ | ------------ | ------------------------------------------ |
| NIP-01 | Compatível   | Formato básico de evento + metadados de perfil |
| NIP-04 | Compatível   | DMs criptografadas (`kind:4`)              |
| NIP-17 | Planejado    | DMs gift-wrapped                           |
| NIP-44 | Planejado    | Criptografia versionada                    |

## Testes

### Relay local

```bash
# Start strfry
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

1. Anote a pubkey (npub) do bot nos logs.
2. Abra um cliente Nostr (Damus, Amethyst etc.).
3. Envie uma DM para a pubkey do bot.
4. Verifique a resposta.

## Solução de problemas

### Não está recebendo mensagens

- Verifique se a chave privada é válida.
- Garanta que as URLs dos relays estejam acessíveis e usem `wss://` (ou `ws://` para local).
- Confirme que `enabled` não é `false`.
- Verifique os logs do Gateway para erros de conexão com relays.

### Não está enviando respostas

- Verifique se o relay aceita gravações.
- Verifique a conectividade de saída.
- Fique atento a limites de taxa do relay.

### Respostas duplicadas

- Esperado ao usar vários relays.
- As mensagens são desduplicadas pelo ID do evento; somente a primeira entrega aciona uma resposta.

## Segurança

- Nunca faça commit de chaves privadas.
- Use variáveis de ambiente para chaves.
- Considere `allowlist` para bots de produção.
- As assinaturas são verificadas antes da política de remetente, e a política de remetente é aplicada antes da descriptografia, portanto eventos falsificados são rejeitados cedo e remetentes desconhecidos não podem forçar trabalho criptográfico completo.

## Limitações (MVP)

- Somente mensagens diretas (sem chats em grupo).
- Sem anexos de mídia.
- Apenas NIP-04 (gift-wrap NIP-17 planejado).

## Relacionado

- [Visão geral de canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação por DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e controle por menções
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e hardening
