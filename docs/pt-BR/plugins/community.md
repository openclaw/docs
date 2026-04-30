---
read_when:
    - Você quer encontrar Plugins de terceiros do OpenClaw
    - Você quer publicar ou listar seu próprio Plugin
summary: 'Plugins do OpenClaw mantidos pela comunidade: navegue, instale e envie o seu próprio'
title: Plugins da comunidade
x-i18n:
    generated_at: "2026-04-30T09:59:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9685aaf141b739a2a745a6184201ac86689e4284bec6eb068ffbd0d53fb4ecf1
    source_path: plugins/community.md
    workflow: 16
---

Plugins da comunidade são pacotes de terceiros que estendem o OpenClaw com novos
canais, ferramentas, provedores ou outros recursos. Eles são criados e mantidos
pela comunidade, geralmente publicados no [ClawHub](/pt-BR/tools/clawhub), e instaláveis
com um único comando. O npm continua sendo uma alternativa compatível para pacotes que
ainda não migraram para o ClawHub.

O ClawHub é a superfície canônica de descoberta para plugins da comunidade. Não abra
PRs apenas de documentação só para adicionar seu plugin aqui para fins de descoberta; publique-o no
ClawHub em vez disso.

```bash
openclaw plugins install <package-name>
```

O OpenClaw verifica o ClawHub primeiro e recorre ao npm automaticamente.

## Plugins listados

### Apify

Extraia dados de qualquer site com mais de 20.000 scrapers prontos para uso. Permita que seu agente
extraia dados do Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, sites de e-commerce e muito mais — apenas pedindo.

- **npm:** `@apify/apify-openclaw-plugin`
- **repositório:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Ponte independente do OpenClaw para conversas do Codex App Server. Vincule um chat a
uma thread do Codex, converse com ela em texto simples e controle-a com comandos
nativos do chat para retomar, planejar, revisar, selecionar modelo, fazer compaction e muito mais.

- **npm:** `openclaw-codex-app-server`
- **repositório:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Integração de robô empresarial usando o modo Stream. Compatível com mensagens de texto, imagens e
arquivos por meio de qualquer cliente DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **repositório:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin de Gerenciamento de Contexto Sem Perdas para OpenClaw. Sumarização de conversas
baseada em DAG com compaction incremental — preserva a fidelidade total do contexto
enquanto reduz o uso de tokens.

- **npm:** `@martian-engineering/lossless-claw`
- **repositório:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin oficial que exporta rastros de agentes para o Opik. Monitore comportamento do agente,
custo, tokens, erros e muito mais.

- **npm:** `@opik/opik-openclaw`
- **repositório:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Dê ao seu agente OpenClaw um avatar Live2D com sincronização labial em tempo real, expressões
emocionais e conversão de texto em fala. Inclui ferramentas de criação para geração de ativos
por IA e implantação com um clique no Prometheus Marketplace. Atualmente em alfa.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repositório:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Conecte o OpenClaw ao QQ por meio da QQ Bot API. Compatível com chats privados, menções em
grupo, mensagens de canal e mídia rica, incluindo voz, imagens, vídeos
e arquivos.

As versões atuais do OpenClaw incluem o QQ Bot. Use a configuração incluída em
[QQ Bot](/pt-BR/channels/qqbot) para instalações normais; instale este plugin externo somente
quando você quiser intencionalmente o pacote autônomo mantido pela Tencent.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repositório:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin de canal WeCom para OpenClaw pela equipe Tencent WeCom. Impulsionado por
conexões persistentes WeCom Bot WebSocket, ele é compatível com mensagens diretas e chats em grupo,
respostas por streaming, mensagens proativas, processamento de imagens/arquivos, formatação
Markdown, controle de acesso integrado e skills de documentos/reuniões/mensagens.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repositório:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Plugin de canal Yuanbao para OpenClaw pela equipe Tencent Yuanbao. Impulsionado por
conexões persistentes WebSocket, ele é compatível com mensagens diretas e chats em grupo,
respostas por streaming, mensagens proativas, processamento de imagens/arquivos/áudio/vídeo,
formatação Markdown, controle de acesso integrado e menus de comandos de barra.

- **npm:** `openclaw-plugin-yuanbao`
- **repositório:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## Envie seu plugin

Recebemos bem plugins da comunidade que sejam úteis, documentados e seguros de operar.

<Steps>
  <Step title="Publique no ClawHub ou npm">
    Seu plugin deve ser instalável via `openclaw plugins install \<package-name\>`.
    Publique no [ClawHub](/pt-BR/tools/clawhub), a menos que você precise especificamente de distribuição
    somente via npm.
    Consulte [Criando Plugins](/pt-BR/plugins/building-plugins) para o guia completo.

  </Step>

  <Step title="Hospede no GitHub">
    O código-fonte deve estar em um repositório público com documentação de configuração e um rastreador de
    problemas.

  </Step>

  <Step title="Use PRs de documentação apenas para mudanças na documentação de origem">
    Você não precisa de um PR de documentação apenas para tornar seu plugin descobrível. Publique-o
    no ClawHub em vez disso.

    Abra um PR de documentação somente quando a documentação de origem do OpenClaw precisar de uma alteração real de
    conteúdo, como corrigir orientações de instalação ou adicionar documentação
    entre repositórios que pertença ao conjunto principal de documentação.

  </Step>
</Steps>

## Padrão de qualidade

| Requisito                   | Por quê                                      |
| --------------------------- | --------------------------------------------- |
| Publicado no ClawHub ou npm | Usuários precisam que `openclaw plugins install` funcione |
| Repositório público no GitHub | Revisão de código-fonte, rastreamento de problemas, transparência |
| Documentação de configuração e uso | Usuários precisam saber como configurá-lo |
| Manutenção ativa            | Atualizações recentes ou tratamento responsivo de problemas |

Wrappers de baixo esforço, propriedade pouco clara ou pacotes sem manutenção podem ser recusados.

## Relacionado

- [Instalar e Configurar Plugins](/pt-BR/tools/plugin) — como instalar qualquer plugin
- [Criando Plugins](/pt-BR/plugins/building-plugins) — crie o seu
- [Manifesto de Plugin](/pt-BR/plugins/manifest) — esquema do manifesto
