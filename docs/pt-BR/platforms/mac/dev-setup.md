---
read_when:
    - Configurando o ambiente de desenvolvimento no macOS
summary: Guia de configuração para desenvolvedores que trabalham no aplicativo macOS do OpenClaw
title: Configuração de desenvolvimento no macOS
x-i18n:
    generated_at: "2026-04-24T06:01:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30f98b3249096fa1e125a7beb77562b7bd36e2c17f524f30a1c58de61bd04da0
    source_path: platforms/mac/dev-setup.md
    workflow: 15
---

# Configuração de desenvolvimento no macOS

Este guia cobre as etapas necessárias para compilar e executar o aplicativo macOS do OpenClaw a partir do código-fonte.

## Pré-requisitos

Antes de compilar o aplicativo, certifique-se de ter o seguinte instalado:

1. **Xcode 26.2+**: necessário para desenvolvimento em Swift.
2. **Node.js 24 & pnpm**: recomendados para o gateway, CLI e scripts de empacotamento. Node 22 LTS, atualmente `22.14+`, continua compatível para fins de compatibilidade.

## 1. Instalar dependências

Instale as dependências do projeto inteiro:

```bash
pnpm install
```

## 2. Compilar e empacotar o aplicativo

Para compilar o aplicativo macOS e empacotá-lo em `dist/OpenClaw.app`, execute:

```bash
./scripts/package-mac-app.sh
```

Se você não tiver um certificado Apple Developer ID, o script usará automaticamente **assinatura ad-hoc** (`-`).

Para modos de execução de desenvolvimento, flags de assinatura e solução de problemas de Team ID, consulte o README do aplicativo macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Observação**: aplicativos assinados ad-hoc podem acionar prompts de segurança. Se o aplicativo falhar imediatamente com "Abort trap 6", consulte a seção [Solução de problemas](#solução-de-problemas).

## 3. Instalar a CLI

O aplicativo macOS espera uma instalação global da CLI `openclaw` para gerenciar tarefas em segundo plano.

**Para instalá-la (recomendado):**

1. Abra o aplicativo OpenClaw.
2. Vá para a aba de configurações **General**.
3. Clique em **"Install CLI"**.

Como alternativa, instale manualmente:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` e `bun add -g openclaw@<version>` também funcionam.
Para o runtime do Gateway, Node continua sendo o caminho recomendado.

## Solução de problemas

### A compilação falha: incompatibilidade de toolchain ou SDK

A compilação do aplicativo macOS espera o SDK mais recente do macOS e a toolchain Swift 6.2.

**Dependências do sistema (obrigatórias):**

- **Versão mais recente do macOS disponível no Software Update** (obrigatória para SDKs do Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Verificações:**

```bash
xcodebuild -version
xcrun swift --version
```

Se as versões não corresponderem, atualize macOS/Xcode e execute a compilação novamente.

### O aplicativo falha ao conceder permissão

Se o aplicativo falhar quando você tentar permitir acesso a **Speech Recognition** ou **Microphone**, isso pode ocorrer devido a um cache TCC corrompido ou incompatibilidade de assinatura.

**Correção:**

1. Redefina as permissões do TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Se isso falhar, altere temporariamente o `BUNDLE_ID` em [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) para forçar um "estado limpo" do macOS.

### Gateway preso em "Starting..."

Se o status do gateway permanecer em "Starting...", verifique se um processo zumbi está segurando a porta:

```bash
openclaw gateway status
openclaw gateway stop

# Se você não estiver usando um LaunchAgent (modo dev / execuções manuais), encontre o listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Se uma execução manual estiver segurando a porta, pare esse processo (Ctrl+C). Como último recurso, finalize o PID encontrado acima.

## Relacionado

- [Aplicativo macOS](/pt-BR/platforms/macos)
- [Visão geral da instalação](/pt-BR/install)
