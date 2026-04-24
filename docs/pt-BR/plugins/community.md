---
read_when:
    - Você quer encontrar Plugins de terceiros do OpenClaw
    - Você quer publicar ou listar seu próprio Plugin
summary: 'Plugins do OpenClaw mantidos pela comunidade: procurar, instalar e enviar o seu próprio'
title: Plugins da comunidade
x-i18n:
    generated_at: "2026-04-24T06:02:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: acce221249df8ceea65436902a33f4906503a1c6f57db3b0ad2058d64c1fb0f7
    source_path: plugins/community.md
    workflow: 15
---

Plugins da comunidade são pacotes de terceiros que estendem o OpenClaw com novos
canais, ferramentas, provedores ou outras capacidades. Eles são criados e mantidos
pela comunidade, publicados no [ClawHub](/pt-BR/tools/clawhub) ou no npm, e
instaláveis com um único comando.

O ClawHub é a superfície canônica de descoberta de Plugins da comunidade. Não abra
PRs apenas de documentação só para adicionar seu Plugin aqui por motivos de descoberta; publique-o no
ClawHub em vez disso.

```bash
openclaw plugins install <package-name>
```

O OpenClaw verifica o ClawHub primeiro e recua automaticamente para o npm.

## Plugins listados

### Apify

Extraia dados de qualquer site com mais de 20.000 scrapers prontos para uso. Deixe seu agente
extrair dados de Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, sites de e-commerce e muito mais — apenas pedindo.

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Ponte independente do OpenClaw para conversas com Codex App Server. Vincule um chat a
uma thread do Codex, converse com ela em texto simples e controle-a com comandos nativos
de chat para retomar, planejar, revisar, selecionar modelo, Compaction e muito mais.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Integração de robô corporativo usando o modo Stream. Oferece suporte a texto, imagens e
mensagens de arquivo por qualquer cliente DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin de gerenciamento de contexto sem perdas para OpenClaw. Sumarização de conversa
baseada em DAG com Compaction incremental — preserva fidelidade total de contexto
enquanto reduz o uso de tokens.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin oficial que exporta traces de agente para Opik. Monitore o comportamento do agente,
custo, tokens, erros e muito mais.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Dê ao seu agente OpenClaw um avatar Live2D com sincronização labial em tempo real, expressões
emocionais e conversão de texto em fala. Inclui ferramentas de criação para geração de ativos com IA
e implantação com um clique no Prometheus Marketplace. Atualmente em alfa.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Conecte o OpenClaw ao QQ via a API de QQ Bot. Oferece suporte a chats privados, menções em
grupo, mensagens de canal e mídia rica, incluindo voz, imagens, vídeos
e arquivos.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin de canal WeCom para OpenClaw pela equipe Tencent WeCom. Com suporte de
conexões persistentes WebSocket do WeCom Bot, ele oferece suporte a
mensagens diretas e chats em grupo, respostas por streaming, mensagens proativas, processamento de imagem/arquivo, formatação Markdown,
controle de acesso interno e Skills de documentos/reuniões/mensagens.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Envie seu Plugin

Aceitamos Plugins da comunidade que sejam úteis, documentados e seguros para operar.

<Steps>
  <Step title="Publicar no ClawHub ou npm">
    Seu Plugin deve ser instalável via `openclaw plugins install \<package-name\>`.
    Publique no [ClawHub](/pt-BR/tools/clawhub) (preferido) ou no npm.
    Consulte [Criando Plugins](/pt-BR/plugins/building-plugins) para o guia completo.

  </Step>

  <Step title="Hospedar no GitHub">
    O código-fonte deve estar em um repositório público com documentação de configuração e um
    rastreador de issues.

  </Step>

  <Step title="Use PRs de documentação apenas para alterações na documentação-fonte">
    Você não precisa de uma PR de documentação apenas para tornar seu Plugin detectável. Publique-o
    no ClawHub em vez disso.

    Abra uma PR de documentação apenas quando a documentação-fonte do OpenClaw precisar de uma
    alteração real de conteúdo, como corrigir orientação de instalação ou adicionar
    documentação entre repositórios que pertença ao conjunto principal de documentação.

  </Step>
</Steps>

## Barra de qualidade

| Requisito                  | Motivo                                        |
| -------------------------- | --------------------------------------------- |
| Publicado no ClawHub ou npm | Os usuários precisam que `openclaw plugins install` funcione |
| Repositório público no GitHub | Revisão de código-fonte, rastreamento de issues, transparência |
| Documentação de configuração e uso | Os usuários precisam saber como configurá-lo |
| Manutenção ativa           | Atualizações recentes ou tratamento responsivo de issues |

Wrappers de baixo esforço, propriedade pouco clara ou pacotes sem manutenção podem ser recusados.

## Relacionado

- [Instalar e configurar Plugins](/pt-BR/tools/plugin) — como instalar qualquer Plugin
- [Criando Plugins](/pt-BR/plugins/building-plugins) — crie o seu próprio
- [Manifesto de Plugin](/pt-BR/plugins/manifest) — schema do manifesto
