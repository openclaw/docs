---
read_when:
    - Revisión de la postura de seguridad o de escenarios de amenazas
    - Trabajo en funciones de seguridad o respuestas de auditoría
summary: Modelo de amenazas de OpenClaw mapeado al marco MITRE ATLAS
title: Modelo de amenazas (MITRE ATLAS)
x-i18n:
    generated_at: "2026-07-11T23:34:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c88ffdef850bd2afaf835baab2555304c914a0be1df6b6b9109e0f55d1448392
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 16
---

**Versión:** 1.0-borrador | **Marco:** [MITRE ATLAS](https://atlas.mitre.org/) (Panorama de amenazas adversarias para sistemas de IA) + diagramas de flujo de datos

Este modelo de amenazas documenta las amenazas adversarias para la plataforma de agentes de IA OpenClaw y el mercado de Skills ClawHub. Es un documento vivo mantenido por la comunidad de OpenClaw. Consulte [Contribuir al modelo de amenazas](/es/security/CONTRIBUTING-THREAT-MODEL) para saber cómo informar sobre nuevas amenazas, proponer cadenas de ataque o sugerir mitigaciones.

**Recursos clave de ATLAS:** [Técnicas](https://atlas.mitre.org/techniques/) | [Tácticas](https://atlas.mitre.org/tactics/) | [Casos de estudio](https://atlas.mitre.org/studies/) | [GitHub de ATLAS](https://github.com/mitre-atlas/atlas-data) | [Contribuir a ATLAS](https://atlas.mitre.org/resources/contribute)

---

## 1. Alcance

| Componente                        | Incluido  | Notas                                                   |
| --------------------------------- | --------- | ------------------------------------------------------- |
| Entorno de ejecución del agente OpenClaw | Sí | Ejecución central del agente, llamadas a herramientas, sesiones |
| Gateway                           | Sí        | Autenticación, enrutamiento, integración de canales     |
| Integraciones de canales          | Sí        | WhatsApp, Telegram, Discord, Signal, Slack, etc.         |
| Mercado ClawHub                   | Sí        | Publicación, moderación y distribución de Skills        |
| Servidores MCP                    | Sí        | Proveedores externos de herramientas                    |
| Dispositivos de usuario           | Parcial   | Aplicaciones móviles, clientes de escritorio            |

Los informes fuera de alcance y los patrones de falsos positivos (exposición a la Internet pública, cadenas basadas únicamente en inyección de instrucciones sin eludir un límite, operadores que no confían entre sí y comparten un mismo host de Gateway, entre otros) se enumeran en [`SECURITY.md`](https://github.com/openclaw/openclaw/blob/main/SECURITY.md); ese archivo es la fuente de referencia actual para el alcance de los informes de vulnerabilidades, no esta página.

## 2. Arquitectura del sistema

### 2.1 Límites de confianza

```text
┌─────────────────────────────────────────────────────────────────┐
│                    ZONA NO CONFIABLE                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│            LÍMITE DE CONFIANZA 1: Acceso al canal               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                              │   │
│  │  • Vinculación de dispositivos (TTL de 1 h para          │   │
│  │    vinculación por MD / 5 min para vinculación de Node)  │   │
│  │  • Validación de AllowFrom / lista de permitidos         │   │
│  │  • Autenticación mediante token / contraseña / Tailscale │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│           LÍMITE DE CONFIANZA 2: Aislamiento de sesiones        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   SESIONES DEL AGENTE                     │   │
│  │  • Clave de sesión = agent:channel:peer                  │   │
│  │  • Políticas de herramientas por agente                  │   │
│  │  • Registro de transcripciones                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│        LÍMITE DE CONFIANZA 3: Ejecución de herramientas         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 ENTORNO AISLADO DE EJECUCIÓN              │   │
│  │  • Entorno aislado de Docker (predeterminado) o host      │   │
│  │    (aprobaciones de ejecución)                            │   │
│  │  • Ejecución remota de Node                               │   │
│  │  • Protección contra SSRF (fijación de DNS + bloqueo de IP)│  │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│          LÍMITE DE CONFIANZA 4: Contenido externo               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │       URL OBTENIDAS / CORREOS ELECTRÓNICOS / WEBHOOKS     │   │
│  │  • Encapsulado de contenido externo                       │   │
│  │    (etiquetas XML con límites aleatorios)                 │   │
│  │  • Inserción de avisos de seguridad                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│        LÍMITE DE CONFIANZA 5: Cadena de suministro              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Publicación de Skills (semver, se requiere SKILL.md)  │   │
│  │  • Análisis de moderación mediante patrones estáticos    │   │
│  │    y técnicas adyacentes al AST                          │   │
│  │  • Revisión agéntica de riesgos basada en LLM + análisis │   │
│  │    de VirusTotal                                         │   │
│  │  • Verificación de antigüedad de la cuenta de GitHub     │   │
│  │    (14 días)                                             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Flujos de datos

| Flujo | Origen  | Destino   | Datos                    | Protección                   |
| ----- | ------- | --------- | ------------------------ | ---------------------------- |
| F1    | Canal   | Gateway   | Mensajes de usuario      | TLS, AllowFrom               |
| F2    | Gateway | Agente    | Mensajes enrutados       | Aislamiento de sesiones      |
| F3    | Agente  | Herramientas | Invocaciones de herramientas | Aplicación de políticas |
| F4    | Agente  | Externo   | Solicitudes `web_fetch`  | Bloqueo de SSRF              |
| F5    | ClawHub | Agente    | Código de Skills         | Moderación, análisis         |
| F6    | Agente  | Canal     | Respuestas               | Filtrado de salida           |

---

## 3. Análisis de amenazas por táctica de ATLAS

### 3.1 Reconocimiento (AML.TA0002)

#### T-RECON-001: Descubrimiento de puntos de conexión del agente

| Atributo                | Valor                                                                          |
| ----------------------- | ------------------------------------------------------------------------------ |
| **ID de ATLAS**         | AML.T0006 - Escaneo activo                                                     |
| **Descripción**         | El atacante busca puntos de conexión expuestos del Gateway de OpenClaw         |
| **Vector de ataque**    | Escaneo de redes, consultas en Shodan, enumeración de DNS                      |
| **Componentes afectados** | Gateway, puntos de conexión de API expuestos                                 |
| **Mitigaciones actuales** | Opción de autenticación mediante Tailscale, enlace a local loopback de forma predeterminada |
| **Riesgo residual**     | Medio: los Gateway públicos se pueden descubrir                                |
| **Recomendaciones**     | Documentar la implementación segura y añadir límites de frecuencia a los puntos de conexión de descubrimiento |

#### T-RECON-002: Sondeo de integraciones de canales

| Atributo                | Valor                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| **ID de ATLAS**         | AML.T0006 - Escaneo activo                                                       |
| **Descripción**         | El atacante sondea los canales de mensajería para identificar cuentas gestionadas por IA |
| **Vector de ataque**    | Envío de mensajes de prueba, observación de patrones de respuesta                 |
| **Componentes afectados** | Todas las integraciones de canales                                              |
| **Mitigaciones actuales** | Ninguna específica                                                             |
| **Riesgo residual**     | Bajo: el descubrimiento por sí solo ofrece un valor limitado                      |
| **Recomendaciones**     | Considerar la aleatorización del tiempo de respuesta                              |

---

### 3.2 Acceso inicial (AML.TA0004)

#### T-ACCESS-001: Interceptación del código de vinculación

| Atributo                | Valor                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **ID de ATLAS**         | AML.T0040 - Acceso a la API de inferencia de modelos de IA                                                                |
| **Descripción**         | El atacante intercepta un código de emparejamiento durante el período de emparejamiento (1 h para mensajes directos/emparejamiento genérico, 5 min para emparejamiento de Node) |
| **Vector de ataque**    | Observación por encima del hombro, interceptación del tráfico de red, ingeniería social                                   |
| **Componentes afectados** | Sistema de emparejamiento de dispositivos                                                                               |
| **Mitigaciones actuales** | TTL de 1 h (mensajes directos/emparejamiento genérico), TTL de 5 min (emparejamiento de Node); códigos enviados mediante el canal existente |
| **Riesgo residual**     | Medio: el período de emparejamiento es explotable                                                                         |
| **Recomendaciones**     | Reducir el período de emparejamiento y añadir un paso de confirmación                                                      |

#### T-ACCESS-002: Suplantación de AllowFrom

| Atributo                | Valor                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| **ID de ATLAS**         | AML.T0040 - Acceso a la API de inferencia de modelos de IA                                 |
| **Descripción**         | El atacante suplanta la identidad de un remitente permitido en un canal                    |
| **Vector de ataque**    | Depende del canal: suplantación del número de teléfono o del nombre de usuario              |
| **Componentes afectados** | Validación de AllowFrom por canal                                                         |
| **Mitigaciones actuales** | Verificación de identidad específica del canal                                            |
| **Riesgo residual**     | Medio: algunos canales siguen siendo vulnerables a la suplantación                          |
| **Recomendaciones**     | Documentar los riesgos específicos de cada canal y añadir verificación criptográfica cuando sea posible |

#### T-ACCESS-003: Robo de tokens

| Atributo                | Valor                                                                         |
| ----------------------- | ----------------------------------------------------------------------------- |
| **ID de ATLAS**         | AML.T0040 - Acceso a la API de inferencia de modelos de IA                    |
| **Descripción**         | El atacante roba tokens de autenticación de archivos de configuración o credenciales |
| **Vector de ataque**    | Software malicioso, acceso no autorizado al dispositivo, exposición de copias de seguridad de la configuración |
| **Componentes afectados** | Almacenamiento de credenciales de canales/proveedores y de la configuración |
| **Mitigaciones actuales** | Permisos de archivos                                                        |
| **Riesgo residual**     | Alto: los tokens se almacenan en texto sin cifrar en el disco                  |
| **Recomendaciones**     | Implementar cifrado de los tokens en reposo y añadir rotación de tokens        |

---

### 3.3 Ejecución (AML.TA0005)

#### T-EXEC-001: Inyección directa de instrucciones

| Atributo                | Valor                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ID de ATLAS**         | AML.T0051.000 - Inyección de instrucciones en LLM: directa                                                                                             |
| **Descripción**         | El atacante envía instrucciones manipuladas para alterar el comportamiento del agente                                                                  |
| **Vector de ataque**    | Mensajes de canal que contienen instrucciones maliciosas                                                                                                |
| **Componentes afectados** | LLM del agente y todas las superficies de entrada                                                                                                     |
| **Mitigaciones actuales** | Detección de patrones y encapsulado de contenido externo; se considera fuera del alcance de los informes de vulnerabilidades si no se elude un límite de seguridad (véase `SECURITY.md`) |
| **Riesgo residual**     | Crítico: solo hay detección, no bloqueo; los ataques sofisticados pueden eludirla                                                                        |
| **Recomendaciones**     | Validación de la salida y confirmación del usuario para acciones sensibles, como capa adicional sobre la detección existente                            |

#### T-EXEC-002: Inyección indirecta de instrucciones

| Atributo                | Valor                                                                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **ID de ATLAS**         | AML.T0051.001 - Inyección de instrucciones en LLM: indirecta                                                                  |
| **Descripción**         | El atacante incorpora instrucciones maliciosas en el contenido obtenido                                                       |
| **Vector de ataque**    | URL maliciosas, correos electrónicos contaminados, webhooks comprometidos                                                     |
| **Componentes afectados** | `web_fetch`, ingesta de correo electrónico y fuentes de datos externas                                                      |
| **Mitigaciones actuales** | Encapsulado del contenido con marcadores de estilo XML con límites aleatorios, normalización de homógrafos/tokens especiales y un aviso de seguridad |
| **Riesgo residual**     | Alto: el LLM aún puede ignorar las instrucciones del encapsulado                                                               |
| **Recomendaciones**     | Contextos de ejecución independientes para el contenido encapsulado                                                           |

#### T-EXEC-003: Inyección de argumentos de herramientas

| Atributo                | Valor                                                                        |
| ----------------------- | ---------------------------------------------------------------------------- |
| **ID de ATLAS**         | AML.T0051.000 - Inyección de instrucciones en LLM: directa                   |
| **Descripción**         | El atacante manipula los argumentos de las herramientas mediante inyección de instrucciones |
| **Vector de ataque**    | Instrucciones manipuladas que influyen en los valores de los parámetros de las herramientas |
| **Componentes afectados** | Todas las invocaciones de herramientas                                      |
| **Mitigaciones actuales** | Aprobaciones de ejecución para comandos peligrosos                          |
| **Riesgo residual**     | Alto: depende del criterio del usuario                                        |
| **Recomendaciones**     | Validación de argumentos y llamadas parametrizadas a herramientas             |

#### T-EXEC-004: Elusión de la aprobación de ejecución

| Atributo                | Valor                                                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID de ATLAS**         | AML.T0043 - Creación de datos maliciosos                                                                                                                                                    |
| **Descripción**         | El atacante crea comandos que eluden la lista de permitidos para aprobaciones                                                                                                               |
| **Vector de ataque**    | Ofuscación de comandos, explotación de alias y manipulación de rutas                                                                                                                        |
| **Componentes afectados** | `src/infra/exec-approvals*.ts` y lista de comandos permitidos                                                                                                                             |
| **Mitigaciones actuales** | Lista de permitidos y modo de consulta, además de normalización de comandos (desempaquetado de envoltorios de despacho, detección de evaluación en línea y análisis de cadenas de shell)    |
| **Riesgo residual**     | Alto: la normalización reduce, pero no elimina, la elusión mediante ofuscación; los hallazgos relativos únicamente a la paridad entre rutas de ejecución se consideran refuerzo de seguridad, no vulnerabilidades (véase `SECURITY.md`) |
| **Recomendaciones**     | Seguir ampliando la cobertura de normalización de comandos frente a nuevas técnicas de ofuscación                                                                                           |

---

### 3.4 Persistencia (AML.TA0006)

#### T-PERSIST-001: Instalación maliciosa de una Skill

| Atributo                | Valor                                                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **ID de ATLAS**         | AML.T0010.001 - Compromiso de la cadena de suministro: software de IA                                                              |
| **Descripción**         | El atacante publica una Skill maliciosa en ClawHub                                                                                  |
| **Vector de ataque**    | Crear una cuenta y publicar una Skill con código malicioso oculto                                                                   |
| **Componentes afectados** | ClawHub, carga de Skills y ejecución del agente                                                                                   |
| **Mitigaciones actuales** | Verificación de la antigüedad de la cuenta de GitHub, análisis estático de patrones y estructuras relacionadas con AST, revisión agéntica de riesgos basada en LLM y análisis con VirusTotal |
| **Riesgo residual**     | Alto: existen capas de detección, pero las Skills siguen ejecutándose con los privilegios del agente y sin aislamiento de ejecución |
| **Recomendaciones**     | Aislamiento de la ejecución de Skills y ampliación de la revisión comunitaria                                                       |

#### T-PERSIST-002: Contaminación de actualizaciones de Skills

| Atributo                | Valor                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------- |
| **ID de ATLAS**         | AML.T0010.001 - Compromiso de la cadena de suministro: software de IA                  |
| **Descripción**         | El atacante compromete una Skill popular y publica una actualización maliciosa          |
| **Vector de ataque**    | Compromiso de la cuenta, ingeniería social dirigida al propietario de la Skill          |
| **Componentes afectados** | Control de versiones de ClawHub y flujos de actualización automática                  |
| **Mitigaciones actuales** | Huellas digitales de versiones y repetición de la moderación/análisis en versiones nuevas |
| **Riesgo residual**     | Alto: las actualizaciones automáticas pueden descargar versiones maliciosas antes de que finalice la revisión |
| **Recomendaciones**     | Firma de actualizaciones, capacidad de reversión y fijación de versiones                 |

#### T-PERSIST-003: Manipulación de la configuración del agente

| Atributo                | Valor                                                                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID de ATLAS**         | AML.T0010.002 - Compromiso de la cadena de suministro: datos                                                                                                   |
| **Descripción**         | El atacante modifica la configuración del agente para mantener el acceso                                                                                       |
| **Vector de ataque**    | Modificación del archivo de configuración, inyección de ajustes                                                                                                |
| **Componentes afectados** | Configuración del agente, políticas de herramientas                                                                                                          |
| **Mitigaciones actuales** | Permisos de archivos                                                                                                                                        |
| **Riesgo residual**     | Medio: requiere acceso local                                                                                                                                   |
| **Recomendaciones**     | Verificación de la integridad de la configuración, registro de auditoría de los cambios de configuración                                                       |

---

### 3.5 Evasión de defensas (AML.TA0007)

#### T-EVADE-001: Evasión de patrones de moderación

| Atributo                | Valor                                                                                                                                               |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID de ATLAS**         | AML.T0043 - Elaboración de datos adversarios                                                                                                        |
| **Descripción**         | El atacante elabora contenido de Skills para evadir las comprobaciones de moderación de ClawHub                                                     |
| **Vector de ataque**    | Homoglifos Unicode, trucos de codificación, carga dinámica                                                                                          |
| **Componentes afectados** | Canalización de moderación y análisis de ClawHub                                                                                                  |
| **Mitigaciones actuales** | Reglas de patrones estáticos, análisis de código próximo al AST, revisión de riesgos agénticos con LLM, VirusTotal                                |
| **Riesgo residual**     | Medio: las técnicas novedosas de ofuscación aún pueden eludir las heurísticas por capas                                                             |
| **Recomendaciones**     | Seguir ampliando el corpus de patrones y comportamientos a medida que se descubran nuevas técnicas de evasión                                       |

#### T-EVADE-002: Escape del envoltorio de contenido

| Atributo                | Valor                                                                                                                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID de ATLAS**         | AML.T0043 - Elaboración de datos adversarios                                                                                                                                  |
| **Descripción**         | El atacante elabora contenido que escapa del contexto del envoltorio de contenido externo                                                                                     |
| **Vector de ataque**    | Manipulación de etiquetas, confusión de contexto, anulación de instrucciones                                                                                                  |
| **Componentes afectados** | Envoltura de contenido externo                                                                                                                                              |
| **Mitigaciones actuales** | Marcadores de estilo XML con límites aleatorios y aviso de seguridad, además de detección de suplantación de marcadores mediante homoglifos o variantes de espacios en blanco |
| **Riesgo residual**     | Medio: se descubren regularmente nuevos métodos de escape                                                                                                                     |
| **Recomendaciones**     | Validación en la salida además de la envoltura en la entrada                                                                                                                  |

---

### 3.6 Descubrimiento (AML.TA0008)

#### T-DISC-001: Enumeración de herramientas

| Atributo                | Valor                                                                     |
| ----------------------- | ------------------------------------------------------------------------- |
| **ID de ATLAS**         | AML.T0040 - Acceso a la API de inferencia de modelos de IA                 |
| **Descripción**         | El atacante enumera las herramientas disponibles mediante instrucciones   |
| **Vector de ataque**    | Consultas del tipo «¿Qué herramientas tienes?»                             |
| **Componentes afectados** | Registro de herramientas del agente                                     |
| **Mitigaciones actuales** | Ninguna específica                                                      |
| **Riesgo residual**     | Bajo: las herramientas suelen estar documentadas                          |
| **Recomendaciones**     | Considerar controles de visibilidad de herramientas                       |

#### T-DISC-002: Extracción de datos de sesión

| Atributo                | Valor                                                                       |
| ----------------------- | --------------------------------------------------------------------------- |
| **ID de ATLAS**         | AML.T0040 - Acceso a la API de inferencia de modelos de IA                   |
| **Descripción**         | El atacante extrae datos confidenciales del contexto de la sesión            |
| **Vector de ataque**    | Consultas del tipo «¿De qué hablamos?», sondeo del contexto                  |
| **Componentes afectados** | Transcripciones de sesiones, ventana de contexto                           |
| **Mitigaciones actuales** | Aislamiento de sesiones por remitente (clave `agent:channel:peer`)         |
| **Riesgo residual**     | Medio: los datos de la sesión son accesibles por diseño                      |
| **Recomendaciones**     | Censura de datos confidenciales en el contexto                               |

---

### 3.7 Recopilación y exfiltración (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Robo de datos mediante web_fetch

| Atributo                | Valor                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| **ID de ATLAS**         | AML.T0009 - Recopilación                                                                                |
| **Descripción**         | El atacante exfiltra datos indicando al agente que los envíe a una URL externa                         |
| **Vector de ataque**    | Inyección de instrucciones que hace que el agente envíe datos mediante POST a un servidor del atacante |
| **Componentes afectados** | Herramienta `web_fetch`                                                                               |
| **Mitigaciones actuales** | Bloqueo de SSRF para redes internas o privadas (fijación de DNS y bloqueo de IP)                      |
| **Riesgo residual**     | Alto: siguen permitiéndose URL externas arbitrarias                                                     |
| **Recomendaciones**     | Lista de URL permitidas, reconocimiento de la clasificación de datos                                    |

#### T-EXFIL-002: Envío no autorizado de mensajes

| Atributo                | Valor                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| **ID de ATLAS**         | AML.T0009 - Recopilación                                                         |
| **Descripción**         | El atacante hace que el agente envíe mensajes que contienen datos confidenciales |
| **Vector de ataque**    | Inyección de instrucciones que hace que el agente envíe un mensaje al atacante   |
| **Componentes afectados** | Herramienta de mensajes, integraciones de canales                              |
| **Mitigaciones actuales** | Control del envío de mensajes salientes                                        |
| **Riesgo residual**     | Medio: el control puede eludirse                                                  |
| **Recomendaciones**     | Confirmación explícita para destinatarios nuevos                                  |

#### T-EXFIL-003: Recolección de credenciales

| Atributo                | Valor                                                                                                                                                                                                           |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID de ATLAS**         | AML.T0009 - Recopilación                                                                                                                                                                                        |
| **Descripción**         | Una Skill maliciosa recopila credenciales del contexto del agente                                                                                                                                               |
| **Vector de ataque**    | El código de la Skill lee variables de entorno y archivos de configuración                                                                                                                                      |
| **Componentes afectados** | Entorno de ejecución de Skills                                                                                                                                                                                |
| **Mitigaciones actuales** | Análisis de patrones de credenciales de ClawHub (secretos codificados directamente y acceso a variables de entorno de credenciales combinado con envíos de red); sin aislamiento de ejecución para Skills en tiempo de ejecución |
| **Riesgo residual**     | Crítico: las Skills se ejecutan con los privilegios del agente                                                                                                                                                  |
| **Recomendaciones**     | Aislamiento de la ejecución de Skills, aislamiento de credenciales                                                                                                                                              |

---

### 3.8 Impacto (AML.TA0011)

#### T-IMPACT-001: Ejecución no autorizada de comandos

| Atributo                | Valor                                                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ID de ATLAS**         | AML.T0031 - Erosión de la integridad del modelo de IA                                                                                                        |
| **Descripción**         | El atacante ejecuta comandos arbitrarios en el sistema del usuario                                                                                           |
| **Vector de ataque**    | Inyección de instrucciones combinada con la elusión de la aprobación de ejecución                                                                            |
| **Componentes afectados** | Herramienta Bash, ejecución de comandos                                                                                                                    |
| **Mitigaciones actuales** | Aprobaciones de ejecución, opción de aislamiento con Docker (backend predeterminado en tiempo de ejecución)                                               |
| **Riesgo residual**     | Crítico: es posible ejecutar comandos en el sistema anfitrión cuando el aislamiento está deshabilitado                                                        |
| **Recomendaciones**     | Mejorar la experiencia de usuario de las aprobaciones; las implementaciones sin aislamiento siguen siendo una elección deliberada del operador y se documentan como tal |

#### T-IMPACT-002: Agotamiento de recursos (DoS)

| Atributo                | Valor                                                         |
| ----------------------- | ------------------------------------------------------------- |
| **ID de ATLAS**         | AML.T0031 - Erosión de la integridad del modelo de IA         |
| **Descripción**         | El atacante agota los créditos de la API o los recursos de cómputo |
| **Vector de ataque**    | Inundación automatizada de mensajes, llamadas costosas a herramientas |
| **Componentes afectados** | Gateway, sesiones del agente, proveedor de API              |
| **Mitigaciones actuales** | Ninguna                                                     |
| **Riesgo residual**     | Alto: no hay limitación de frecuencia por remitente            |
| **Recomendaciones**     | Límites de frecuencia por remitente, presupuestos de costes    |

#### T-IMPACT-003: Daño reputacional

| Atributo                | Valor                                                                       |
| ----------------------- | --------------------------------------------------------------------------- |
| **ID de ATLAS**         | AML.T0031 - Erosión de la integridad del modelo de IA                       |
| **Descripción**         | El atacante hace que el agente envíe contenido dañino u ofensivo            |
| **Vector de ataque**    | Inyección de instrucciones que provoca respuestas inapropiadas              |
| **Componentes afectados** | Generación de resultados, mensajería de canales                           |
| **Mitigaciones actuales** | Políticas de contenido del proveedor de LLM                               |
| **Riesgo residual**     | Medio: los filtros del proveedor son imperfectos                            |
| **Recomendaciones**     | Capa de filtrado de resultados, controles de usuario                        |

---

## 4. Análisis de la cadena de suministro de ClawHub

### 4.1 Controles de seguridad actuales

| Control                                | Implementación                                                                                      | Eficacia                                                                    |
| -------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Antigüedad de la cuenta de GitHub      | `requireGitHubAccountAge()` (mínimo de 14 días)                                                     | Media: eleva el nivel de dificultad para nuevos atacantes                   |
| Saneamiento de rutas                   | `sanitizePath()`                                                                                    | Alta: evita el recorrido de rutas                                           |
| Validación del tipo de archivo         | `isTextFile()`                                                                                      | Media: solo se analizan archivos de texto, pero sigue siendo explotable     |
| Límites de tamaño                      | Paquete total de 50 MB (`MAX_PUBLISH_TOTAL_BYTES`)                                                  | Alta: evita el agotamiento de recursos                                      |
| SKILL.md obligatorio                   | Archivo léame obligatorio al publicar                                                               | Bajo valor de seguridad: solo informativo                                   |
| Análisis estático y adyacente al AST   | Motor de patrones que abarca ejecución, exfiltración, obtención de credenciales, ofuscación y más   | Media-alta: abarca muchos patrones de abuso conocidos, pero se basa en ellos |
| Revisión agéntica de riesgos con un LLM | Veredicto basado en un prompt de seguridad al publicar                                              | Media-alta: detecta comportamientos que los patrones estáticos no detectan  |
| Análisis con VirusTotal                | Integrado en los flujos de publicación y reanálisis de Skills y versiones de paquetes, condicionado a la clave de API del operador | Alta cuando está habilitado: detección mediante motores estáticos           |
| Estado de moderación                   | Campo `moderationStatus`                                                                            | Media: permite la revisión manual                                           |

### 4.2 Limitaciones de la moderación

El análisis estático de ClawHub inspecciona directamente el contenido del código de la Skill (no solo el slug, los metadatos o el frontmatter) y abarca llamadas de ejecución peligrosas, ejecución dinámica de código, obtención de credenciales, patrones de exfiltración, cargas útiles ofuscadas y más. Limitaciones conocidas:

- La detección basada en patrones aún puede eludirse mediante técnicas de ofuscación suficientemente novedosas.
- La revisión basada en LLM y el análisis con VirusTotal dependen de que las claves de API y la configuración del operador estén habilitadas.
- Ningún entorno aislado de ejecución separa una Skill de los privilegios propios del agente una vez instalada.

### 4.3 Insignias

Las Skills y los paquetes llevan insignias asignadas por los moderadores: `highlighted`, `official`, `deprecated`, `redactionApproved` (solo Skills). Los informes de la comunidad (`skillReports`) y los registros de auditoría (`auditLogs`) respaldan los flujos de trabajo de moderación.

---

## 5. Matriz de riesgos

### 5.1 Probabilidad frente a impacto

| ID de amenaza | Probabilidad | Impacto  | Nivel de riesgo | Prioridad |
| ------------- | ------------ | -------- | --------------- | --------- |
| T-EXEC-001    | Alta         | Crítico  | **Crítico**     | P0        |
| T-PERSIST-001 | Alta         | Crítico  | **Crítico**     | P0        |
| T-EXFIL-003   | Media        | Crítico  | **Crítico**     | P0        |
| T-IMPACT-001  | Media        | Crítico  | **Alto**        | P1        |
| T-EXEC-002    | Alta         | Alto     | **Alto**        | P1        |
| T-EXEC-004    | Media        | Alto     | **Alto**        | P1        |
| T-ACCESS-003  | Media        | Alto     | **Alto**        | P1        |
| T-EXFIL-001   | Media        | Alto     | **Alto**        | P1        |
| T-IMPACT-002  | Alta         | Medio    | **Alto**        | P1        |
| T-EVADE-001   | Alta         | Medio    | **Medio**       | P2        |
| T-ACCESS-001  | Baja         | Alto     | **Medio**       | P2        |
| T-ACCESS-002  | Baja         | Alto     | **Medio**       | P2        |
| T-PERSIST-002 | Baja         | Alto     | **Medio**       | P2        |

### 5.2 Cadenas de ataque de ruta crítica

**Cadena 1: robo de datos mediante una Skill**

```text
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Publicar una Skill maliciosa) → (Eludir la moderación) → (Obtener credenciales)
```

**Cadena 2: de inyección de prompts a RCE**

```text
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Inyectar un prompt) → (Eludir la aprobación de ejecución) → (Ejecutar comandos)
```

**Cadena 3: inyección indirecta mediante contenido obtenido**

```text
T-EXEC-002 → T-EXFIL-001 → Exfiltración externa
(Contaminar el contenido de una URL) → (El agente obtiene y sigue las instrucciones) → (Los datos se envían al atacante)
```

---

## 6. Resumen de recomendaciones

### 6.1 Inmediatas (P0)

| ID    | Recomendación                                                | Aborda                     |
| ----- | ------------------------------------------------------------ | -------------------------- |
| R-002 | Implementar el aislamiento de la ejecución de Skills         | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Añadir validación de salida para acciones sensibles          | T-EXEC-001, T-EXEC-002     |

### 6.2 A corto plazo (P1)

| ID    | Recomendación                                                                          | Aborda       |
| ----- | -------------------------------------------------------------------------------------- | ------------ |
| R-004 | Implementar límites de frecuencia por remitente                                        | T-IMPACT-002 |
| R-005 | Añadir cifrado en reposo para los tokens                                               | T-ACCESS-003 |
| R-006 | Mejorar la experiencia de aprobación de ejecución y seguir ampliando la normalización de comandos | T-EXEC-004   |
| R-007 | Implementar una lista de permitidos de URL para `web_fetch`                            | T-EXFIL-001  |

### 6.3 A medio plazo (P2)

| ID    | Recomendación                                                      | Aborda        |
| ----- | ------------------------------------------------------------------ | ------------- |
| R-008 | Añadir verificación criptográfica del canal cuando sea posible     | T-ACCESS-002  |
| R-009 | Implementar la verificación de integridad de la configuración      | T-PERSIST-003 |
| R-010 | Añadir firma de actualizaciones y fijación de versiones            | T-PERSIST-002 |

---

## 7. Apéndices

### 7.1 Correspondencia de técnicas de ATLAS

| ID de ATLAS   | Nombre de la técnica                         | Amenazas de OpenClaw                                              |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| AML.T0006     | Análisis activo                              | T-RECON-001, T-RECON-002                                         |
| AML.T0009     | Recopilación                                 | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                            |
| AML.T0010.001 | Cadena de suministro: software de IA         | T-PERSIST-001, T-PERSIST-002                                     |
| AML.T0010.002 | Cadena de suministro: datos                  | T-PERSIST-003                                                    |
| AML.T0031     | Erosión de la integridad del modelo de IA    | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                         |
| AML.T0040     | Acceso a la API de inferencia del modelo de IA | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002 |
| AML.T0043     | Elaboración de datos adversarios             | T-EXEC-004, T-EVADE-001, T-EVADE-002                             |
| AML.T0051.000 | Inyección de prompts en LLM: directa         | T-EXEC-001, T-EXEC-003                                           |
| AML.T0051.001 | Inyección de prompts en LLM: indirecta       | T-EXEC-002                                                       |

### 7.2 Archivos de seguridad clave

| Ruta                                | Propósito                                         | Nivel de riesgo |
| ----------------------------------- | ------------------------------------------------- | --------------- |
| `src/infra/exec-approvals.ts`       | Lógica de aprobación de comandos                  | **Crítico**     |
| `src/gateway/auth.ts`               | Autenticación del Gateway                         | **Crítico**     |
| `src/infra/net/ssrf.ts`             | Protección contra SSRF                            | **Crítico**     |
| `src/security/external-content.ts`  | Mitigación de la inyección de prompts             | **Crítico**     |
| `src/agents/sandbox/tool-policy.ts` | Política de herramientas permitidas y denegadas en el entorno aislado | **Crítico**     |
| `src/routing/resolve-route.ts`      | Aislamiento y enrutamiento de sesiones            | **Medio**       |

### 7.3 Glosario

| Término                  | Definición                                                       |
| ------------------------ | ---------------------------------------------------------------- |
| **ATLAS**                | Panorama de amenazas adversarias de MITRE para sistemas de IA    |
| **ClawHub**              | Mercado de Skills de OpenClaw                                    |
| **Gateway**              | Capa de enrutamiento de mensajes y autenticación de OpenClaw     |
| **MCP**                  | Protocolo de contexto de modelo: interfaz de proveedores de herramientas |
| **Inyección de prompts** | Ataque en el que se incrustan instrucciones maliciosas en la entrada |
| **Skill**                | Extensión descargable para agentes de OpenClaw                   |
| **SSRF**                 | Falsificación de solicitudes del lado del servidor               |

---

_Este modelo de amenazas es un documento vivo. Informa de problemas de seguridad a `security@openclaw.ai` o consulta la [página de confianza](https://trust.openclaw.ai)._

## Contenido relacionado

- [Contribuir al modelo de amenazas](/es/security/CONTRIBUTING-THREAT-MODEL)
- [Respuesta ante incidentes](/es/security/incident-response)
- [Proxy de red](/es/security/network-proxy)
- [Verificación formal](/es/security/formal-verification)
