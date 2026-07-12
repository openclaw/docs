---
read_when:
    - Você quer que o OpenClaw receba mensagens diretas via Nostr
    - Você está configurando mensagens descentralizadas
summary: Canal de mensagens diretas do Nostr por meio de mensagens criptografadas com NIP-04
title: Nostr
x-i18n:
    generated_at: "2026-07-11T23:46:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31fa283f706036a37795ddad71602058ba94388a9cb01044927c4bb2d83ba4a8
    source_path: channels/nostr.md
    workflow: 16
---

Nostr é um plugin de canal disponível para download (`@openclaw/nostr`) que permite ao OpenClaw receber e responder a mensagens diretas criptografadas com NIP-04 por meio de relays Nostr. Uma conta por Gateway; somente mensagens diretas.

## Instalação

```bash
openclaw plugins install @openclaw/nostr
```

Use a especificação simples do pacote para acompanhar a tag oficial da versão atual. Fixe uma versão exata somente quando precisar de uma instalação reproduzível.

A partir de um checkout local (fluxos de desenvolvimento):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Reinicie o Gateway após instalar ou habilitar plugins. A integração inicial (`openclaw onboard`) e `openclaw channels add` disponibilizam o Nostr a partir do catálogo compartilhado de canais assim que o plugin é instalado.

### Configuração não interativa

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Use `--use-env` para manter `NOSTR_PRIVATE_KEY` no ambiente em vez de armazenar a chave na configuração (somente para a conta padrão).

## Configuração rápida

1. Gere um par de chaves Nostr (se necessário):

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

| Chave        | Tipo     | Padrão                                      | Descrição                                                        |
| ------------ | -------- | ------------------------------------------- | ---------------------------------------------------------------- |
| `privateKey` | string   | obrigatório                                 | Chave privada no formato `nsec` ou hexadecimal; referências a segredos são permitidas |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | URLs dos relays (WebSocket)                                      |
| `dmPolicy`   | string   | `pairing`                                   | Política de acesso a mensagens diretas                           |
| `allowFrom`  | string[] | `[]`                                        | Chaves públicas de remetentes permitidos                         |
| `enabled`    | boolean  | `true`                                      | Habilitar/desabilitar o canal                                    |
| `name`       | string   | -                                           | Nome de exibição                                                  |
| `profile`    | object   | -                                           | Metadados de perfil NIP-01                                       |

## Metadados do perfil

Os dados do perfil são publicados como um evento NIP-01 `kind:0`. Você pode gerenciá-los pela interface de controle (Channels -> Nostr -> Profile) ou defini-los diretamente na configuração.

Exemplo:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Bot de mensagens diretas que atua como assistente pessoal",
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
- A importação de relays mescla os campos e preserva as substituições locais.

## Controle de acesso

### Políticas de mensagens diretas

- **pairing** (padrão): remetentes desconhecidos recebem um código de pareamento.
- **allowlist**: somente chaves públicas em `allowFrom` podem enviar mensagens diretas.
- **open**: mensagens diretas públicas de entrada (requer `allowFrom: ["*"]`).
- **disabled**: ignora mensagens diretas de entrada.

Observações sobre a aplicação das regras:

- As assinaturas dos eventos de entrada são verificadas antes da política de remetentes e da descriptografia NIP-04; assim, eventos falsificados são rejeitados antecipadamente.
- As respostas de pareamento são enviadas sem descriptografar nem processar o conteúdo da mensagem direta original.
- As mensagens diretas de entrada têm limitação de taxa (global e por remetente), e conteúdos grandes demais são descartados antes da descriptografia.

### Exemplo de lista de permissões

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

- **Chave privada:** `nsec...` ou hexadecimal com 64 caracteres
- **Chaves públicas (`allowFrom`):** `npub...` ou hexadecimal

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

- Use de 2 a 3 relays para redundância.
- Evite relays demais (latência e duplicação).
- Relays pagos podem aumentar a confiabilidade.
- Relays locais são adequados para testes (`ws://localhost:7777`).

## Compatibilidade com protocolos

| NIP    | Status      | Descrição                                      |
| ------ | ----------- | ---------------------------------------------- |
| NIP-01 | Compatível  | Formato básico de eventos + metadados de perfil |
| NIP-04 | Compatível  | Mensagens diretas criptografadas (`kind:4`)    |
| NIP-17 | Planejado   | Mensagens diretas encapsuladas                 |
| NIP-44 | Planejado   | Criptografia com controle de versão            |

## Testes

### Relay local

```bash
# Iniciar o strfry
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

1. Anote a chave pública do bot nos logs do Gateway ou em `openclaw channels status` (hexadecimal; converta para npub no seu cliente, se necessário).
2. Abra um cliente Nostr (Amethyst, Damus etc.).
3. Envie uma mensagem direta para a chave pública do bot.
4. Verifique a resposta.

## Solução de problemas

### Mensagens não são recebidas

- Verifique se a chave privada é válida.
- Certifique-se de que as URLs dos relays estejam acessíveis e usem `wss://` (ou `ws://` para um relay local).
- Confirme que `enabled` não seja `false`.
- Verifique os logs do Gateway em busca de erros de conexão com relays.

### Respostas não são enviadas

- Verifique se o relay aceita gravações.
- Verifique a conectividade de saída.
- Observe possíveis limites de taxa dos relays.

### Respostas duplicadas

- Isso é esperado ao usar vários relays.
- As mensagens são desduplicadas pelo ID do evento; somente a primeira entrega aciona uma resposta.

## Segurança

- Nunca faça commit de chaves privadas.
- Use variáveis de ambiente para as chaves.
- Considere usar `allowlist` para bots em produção.
- As assinaturas são verificadas antes da política de remetentes, e essa política é aplicada antes da descriptografia; assim, eventos falsificados são rejeitados antecipadamente e remetentes desconhecidos não podem forçar a execução de todo o processamento criptográfico.

## Limitações (MVP)

- Somente mensagens diretas (sem conversas em grupo).
- Sem anexos de mídia.
- Somente NIP-04 (encapsulamento NIP-17 planejado).

## Conteúdo relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação de mensagens diretas e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de conversas em grupo e controle por menções
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e proteção
