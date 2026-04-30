---
read_when:
    - Configurando o ambiente de desenvolvimento no macOS
summary: Guia de configuração para desenvolvedores que trabalham no aplicativo OpenClaw para macOS
title: Configuração de desenvolvimento no macOS
x-i18n:
    generated_at: "2026-04-30T09:57:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0c494b7a214b6db2880ba02c512653c35dbcdf80805bee9777ec946412668e1
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Configuração de desenvolvedor do macOS

Compile e execute o aplicativo OpenClaw para macOS a partir do código-fonte.

## Pré-requisitos

Antes de compilar o app, garanta que você tenha os seguintes itens instalados:

1. **Xcode 26.2+**: necessário para desenvolvimento em Swift.
2. **Node.js 24 e pnpm**: recomendado para o Gateway, a CLI e os scripts de empacotamento. O Node 22 LTS, atualmente `22.14+`, continua compatível.

## 1. Instale as dependências

Instale as dependências de todo o projeto:

```bash
pnpm install
```

## 2. Compile e empacote o app

Para compilar o app para macOS e empacotá-lo em `dist/OpenClaw.app`, execute:

```bash
./scripts/package-mac-app.sh
```

Se você não tiver um certificado de ID de Desenvolvedor Apple, o script usará automaticamente **assinatura ad hoc** (`-`).

Para modos de execução de desenvolvimento, flags de assinatura e solução de problemas com ID de equipe, consulte o README do app para macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Observação**: apps assinados ad hoc podem acionar avisos de segurança. Se o app travar imediatamente com "Abort trap 6", consulte a seção [Solução de problemas](#troubleshooting).

## 3. Instale a CLI

O app para macOS espera uma instalação global da CLI `openclaw` para gerenciar tarefas em segundo plano.

**Para instalá-la (recomendado):**

1. Abra o app OpenClaw.
2. Acesse a aba de configurações **Geral**.
3. Clique em **"Instalar CLI"**.

Como alternativa, instale manualmente:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` e `bun add -g openclaw@<version>` também funcionam.
Para o runtime do Gateway, o Node continua sendo o caminho recomendado.

## Solução de problemas

### A compilação falha: incompatibilidade de toolchain ou SDK

A compilação do app para macOS espera o SDK mais recente do macOS e a toolchain Swift 6.2.

**Dependências do sistema (obrigatórias):**

- **Versão mais recente do macOS disponível na Atualização de Software** (exigida pelos SDKs do Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Verificações:**

```bash
xcodebuild -version
xcrun swift --version
```

Se as versões não corresponderem, atualize o macOS/Xcode e execute a compilação novamente.

### O app trava ao conceder permissão

Se o app travar quando você tentar permitir acesso a **Reconhecimento de Fala** ou **Microfone**, isso pode ocorrer devido a um cache TCC corrompido ou a uma incompatibilidade de assinatura.

**Correção:**

1. Redefina as permissões TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Se isso falhar, altere temporariamente o `BUNDLE_ID` em [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) para forçar um "estado limpo" no macOS.

### Gateway em "Iniciando..." indefinidamente

Se o status do Gateway permanecer em "Iniciando...", verifique se um processo zumbi está ocupando a porta:

```bash
openclaw gateway status
openclaw gateway stop

# Se você não estiver usando um LaunchAgent (modo de desenvolvimento / execuções manuais), encontre o listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Se uma execução manual estiver ocupando a porta, interrompa esse processo (Ctrl+C). Como último recurso, encerre o PID encontrado acima.

## Relacionados

- [App para macOS](/pt-BR/platforms/macos)
- [Visão geral da instalação](/pt-BR/install)
