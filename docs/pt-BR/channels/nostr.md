---
read_when:
    - Você quer que o OpenClaw receba mensagens diretas via Nostr
    - Você está configurando mensagens descentralizadas
summary: Canal de mensagens diretas do Nostr via mensagens criptografadas NIP-04
title: Nostr
x-i18n:
    generated_at: "2026-05-02T22:16:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6158c22c0ffc5aea56d0ac2b68955f30c3a785013dba5410cbd70f9b689dc3c
    source_path: channels/nostr.md
    workflow: 16
---

**Status:** Plugin incluído opcional (desativado por padrão até ser configurado).

Nostr é um protocolo descentralizado para redes sociais. Este canal permite que o OpenClaw receba e responda a mensagens diretas criptografadas (DMs) via NIP-04.

## Plugin incluído

As versões atuais do OpenClaw distribuem o Nostr como um plugin incluído, portanto builds empacotados
normais não precisam de uma instalação separada.

### Instalações antigas/personalizadas

- O onboarding (`openclaw onboard`) e `openclaw channels add` ainda exibem
  o Nostr a partir do catálogo compartilhado de canais.
- Se o seu build excluir o Nostr incluído, instale o pacote npm diretamente.

```bash
openclaw plugins install @openclaw/nostr
```

Use o pacote simples para acompanhar a tag de versão oficial atual. Fixe uma
versão exata somente quando precisar de uma instalação reproduzível.

Use um checkout local (fluxos de desenvolvimento):

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

| Chave        | Tipo     | Padrão                                     | Descrição                               |
| ------------ | -------- | ------------------------------------------- | --------------------------------------- |
| `privateKey` | string   | obrigatório                                | Chave privada em formato `nsec` ou hex  |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | URLs de relays (WebSocket)              |
| `dmPolicy`   | string   | `pairing`                                   | Política de acesso a DMs                |
| `allowFrom`  | string[] | `[]`                                        | Pubkeys de remetentes permitidos        |
| `enabled`    | boolean  | `true`                                      | Habilitar/desabilitar canal             |
| `name`       | string   | -                                           | Nome de exibição                        |
| `profile`    | object   | -                                           | Metadados de perfil NIP-01              |

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

Observações:

- URLs de perfil devem usar `https://`.
- A importação a partir de relays mescla campos e preserva substituições locais.

## Controle de acesso

### Políticas de DM

- **pairing** (padrão): remetentes desconhecidos recebem um código de pairing.
- **allowlist**: somente pubkeys em `allowFrom` podem enviar DM.
- **open**: DMs públicas de entrada (exige `allowFrom: ["*"]`).
- **disabled**: ignora DMs de entrada.

Observações de aplicação:

- Assinaturas de eventos de entrada são verificadas antes da política de remetente e da descriptografia NIP-04, portanto eventos forjados são rejeitados cedo.
- Respostas de pairing são enviadas sem processar o corpo da DM original.
- DMs de entrada têm limite de taxa, e cargas úteis grandes demais são descartadas antes da descriptografia.

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
- Evite relays demais (latência, duplicação).
- Relays pagos podem melhorar a confiabilidade.
- Relays locais são adequados para testes (`ws://localhost:7777`).

## Suporte de protocolo

| NIP    | Status      | Descrição                                  |
| ------ | ----------- | ------------------------------------------ |
| NIP-01 | Compatível  | Formato básico de evento + metadados de perfil |
| NIP-04 | Compatível  | DMs criptografadas (`kind:4`)              |
| NIP-17 | Planejado   | DMs encapsuladas como presente             |
| NIP-44 | Planejado   | Criptografia versionada                    |

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

### Não recebe mensagens

- Verifique se a chave privada é válida.
- Garanta que as URLs de relay estejam acessíveis e usem `wss://` (ou `ws://` para local).
- Confirme que `enabled` não é `false`.
- Verifique os logs do Gateway para erros de conexão com relay.

### Não envia respostas

- Verifique se o relay aceita escritas.
- Verifique a conectividade de saída.
- Fique atento aos limites de taxa do relay.

### Respostas duplicadas

- Esperado ao usar vários relays.
- As mensagens são desduplicadas por ID de evento; somente a primeira entrega aciona uma resposta.

## Segurança

- Nunca faça commit de chaves privadas.
- Use variáveis de ambiente para chaves.
- Considere `allowlist` para bots em produção.
- Assinaturas são verificadas antes da política de remetente, e a política de remetente é aplicada antes da descriptografia, portanto eventos forjados são rejeitados cedo e remetentes desconhecidos não podem forçar trabalho criptográfico completo.

## Limitações (MVP)

- Somente mensagens diretas (sem chats em grupo).
- Sem anexos de mídia.
- Somente NIP-04 (NIP-17 gift-wrap planejado).

## Relacionados

- [Visão geral de canais](/pt-BR/channels) — todos os canais compatíveis
- [Pairing](/pt-BR/channels/pairing) — autenticação de DM e fluxo de pairing
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e controle por menções
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e hardening
