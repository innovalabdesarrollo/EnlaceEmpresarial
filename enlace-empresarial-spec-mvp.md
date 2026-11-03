# ENLACE EMPRESARIAL — Especificación MVP

> Exportado desde **Traductor Dev** · 2/11/2026, 6:48:40 p.m.

## Resumen del proyecto

| Campo | Valor |
| --- | --- |
| Estado | draft |
| Presupuesto | $0 |
| Tipo de sistema | — |
| Plazo MVP | — |

### Objetivo

Automatizar el proceso de recepción y organización de la información que los clientes depositan en el sistema, mediante la lectura y análisis de cada archivo para identificar automáticamente a qué cliente corresponde y clasificarlo en su carpeta respectiva, eliminando la clasificación manual, reduciendo errores de asignación y agilizando los tiempos de procesamiento del despacho. Adicionalmente, se busca automatizar el envío por correo electrónico de los documentos que el equipo contable procesa y deposita en carpetas designadas, de modo que estos lleguen a los clientes de forma inmediata y sin intervención manual una vez finalizado su procesamiento.

### Propuesta de solución

Se propone el desarrollo de un software con inteligencia artificial capaz de leer, interpretar y clasificar automáticamente los documentos que los clientes depositan en el sistema. Mediante modelos de procesamiento de lenguaje natural y reconocimiento de contenido (texto, metadatos, estructura del documento, etc.), la solución identificará a qué cliente pertenece cada archivo —incluso cuando el nombre o la carpeta de origen no sean concluyentes— y lo moverá automáticamente a la carpeta correspondiente dentro de la estructura documental del despacho. El modelo podrá entrenarse y ajustarse con el histórico documental de cada cliente para mejorar progresivamente su precisión, y marcará para revisión manual únicamente los casos de baja confianza en la clasificación.

En una segunda fase, el mismo software incorporará un módulo de envío automático impulsado por IA: al detectar un nuevo archivo depositado por el equipo contable en las carpetas designadas como "procesado" o "listo para envío", el sistema identificará el destinatario correcto, redactará y enviará automáticamente el correo electrónico correspondiente con el documento adjunto, dejando un registro trazable de cada envío.

De esta forma, el proyecto no se limita a automatizar tareas repetitivas mediante reglas fijas, sino que desarrolla una solución inteligente capaz de aprender y adaptarse a los patrones documentales del despacho, mejorando con el tiempo su exactitud en la clasificación y distribución de la información.

## Actores del sistema (2)

### Cliente

Persona o empresa que deposita documentos en el sistema y recibe los documentos procesados mediante los canales configurados, principalmente correo electrónico en la segunda fase del proyecto.

### Personal contable

Usuario del despacho que procesa documentos, deposita archivos en las carpetas designadas y atiende los casos que requieren revisión manual.

## Historias de usuario (16)

### Depositar documentos en el sistema

- **Rol:** Cliente
- **Prioridad:** Alta
- **Formato:** Como **Cliente**, quiero **poder cargar uno o varios documentos desde el canal habilitado** para **pueda enviarlos al despacho sin tener que clasificarlos manualmente por cliente o tipo de documento**.

**Criterios de aceptación:**

- El sistema permite seleccionar y cargar archivos compatibles, muestra el progreso de la carga y confirma cuando cada documento fue recibido correctamente.

### Consultar el estado de los documentos enviados

- **Rol:** Cliente
- **Prioridad:** Alta
- **Formato:** Como **Cliente**, quiero **poder consultar si mis documentos están recibidos, en revisión, clasificados o procesados** para **pueda conocer el avance de la gestión sin contactar directamente al despacho**.

**Criterios de aceptación:**

- Cada documento muestra un estado actualizado, fecha de recepción y, cuando corresponda, una indicación de que requiere revisión manual.

### Recibir confirmación de recepción

- **Rol:** Cliente
- **Prioridad:** Media
- **Formato:** Como **Cliente**, quiero **recibir una confirmación cuando el sistema haya recibido correctamente mis documentos** para **tenga evidencia de que la información fue depositada y no necesito volver a enviarla**.

**Criterios de aceptación:**

- Después de una carga exitosa, el sistema muestra una confirmación y envía una notificación al canal configurado con el detalle de los archivos recibidos.

### Recibir documentos procesados automáticamente

- **Rol:** Cliente
- **Prioridad:** Alta
- **Formato:** Como **Cliente**, quiero **recibir por correo electrónico los documentos que el despacho haya procesado** para **pueda acceder oportunamente a la información final sin depender de un envío manual**.

**Criterios de aceptación:**

- Cuando un documento sea marcado como listo para envío, el sistema lo remite al destinatario configurado, incluyendo el archivo adjunto y la información básica del documento.

### Consultar el historial de documentos y envíos

- **Rol:** Cliente
- **Prioridad:** Media
- **Formato:** Como **Cliente**, quiero **poder consultar el historial de los documentos depositados y de los envíos realizados** para **pueda verificar qué archivos fueron enviados, cuándo y a qué dirección de correo**.

**Criterios de aceptación:**

- El historial permite visualizar documento, fecha, estado, fecha de envío y destinatario; los envíos fallidos se identifican claramente.

### Recibir notificaciones de errores o revisiones

- **Rol:** Cliente
- **Prioridad:** Media
- **Formato:** Como **Cliente**, quiero **ser notificado cuando un documento no pueda clasificarse, procesarse o enviarse correctamente** para **pueda corregir la información o tomar las acciones necesarias para completar la gestión**.

**Criterios de aceptación:**

- El sistema notifica el motivo general del inconveniente, identifica el documento afectado y proporciona la instrucción o canal definido para resolverlo.

### Acceder de forma segura a los documentos

- **Rol:** Cliente
- **Prioridad:** Crítica
- **Formato:** Como **Cliente**, quiero **poder consultar y descargar únicamente mis documentos y notificaciones** para **se mantenga la confidencialidad de mi información empresarial y contable**.

**Criterios de aceptación:**

- El acceso requiere autenticación, restringe la información al cliente correspondiente y permite descargar los documentos autorizados sin exponer archivos de otros clientes.

### Consultar documentos clasificados

- **Rol:** Personal contable
- **Prioridad:** Alta
- **Formato:** Como **Personal contable**, quiero **consultar los documentos que el sistema ha clasificado y organizado por cliente** para **pueda verificar rápidamente que la documentación fue asignada correctamente**.

**Criterios de aceptación:**

- La vista muestra el nombre del archivo, cliente asignado, fecha de procesamiento, nivel de confianza y estado de clasificación. Permite filtrar por cliente, fecha y estado.

### Revisar documentos con baja confianza

- **Rol:** Personal contable
- **Prioridad:** Crítica
- **Formato:** Como **Personal contable**, quiero **recibir y consultar una bandeja de documentos cuya clasificación requiere revisión manual** para **pueda resolver los casos que el sistema no identifica con suficiente certeza**.

**Criterios de aceptación:**

- La bandeja incluye únicamente documentos marcados para revisión, muestra los datos utilizados por el sistema para sugerir la clasificación y permite abrir o descargar el archivo.

### Confirmar o corregir la clasificación

- **Rol:** Personal contable
- **Prioridad:** Crítica
- **Formato:** Como **Personal contable**, quiero **confirmar la clasificación sugerida o asignar el documento a otro cliente y carpeta** para **pueda garantizar que cada archivo quede organizado correctamente**.

**Criterios de aceptación:**

- Puedo aceptar la sugerencia o seleccionar un cliente y carpeta válidos. Al guardar, el archivo se mueve a la ubicación seleccionada y queda registrada la decisión manual.

### Consultar el historial de procesamiento

- **Rol:** Personal contable
- **Prioridad:** Alta
- **Formato:** Como **Personal contable**, quiero **consultar el historial de clasificación y movimientos de los documentos** para **pueda rastrear qué ocurrió con cada archivo y detectar errores de procesamiento**.

**Criterios de aceptación:**

- El historial muestra archivo, cliente, acción realizada, usuario o proceso responsable, fecha, estado y mensajes de error cuando corresponda. Permite buscar por nombre de archivo o cliente.

### Corregir errores de procesamiento

- **Rol:** Personal contable
- **Prioridad:** Alta
- **Formato:** Como **Personal contable**, quiero **identificar y gestionar archivos que no pudieron ser leídos, clasificados o movidos** para **pueda completar su procesamiento sin perder documentos**.

**Criterios de aceptación:**

- El sistema muestra una lista de errores con una causa comprensible y permite reintentar el procesamiento o descargar el archivo para gestionarlo manualmente.

### Depositar documentos procesados para envío

- **Rol:** Personal contable
- **Prioridad:** Alta
- **Formato:** Como **Personal contable**, quiero **depositar documentos en una carpeta o estado de listo para envío** para **el sistema pueda detectar que fueron procesados y preparar su entrega al cliente**.

**Criterios de aceptación:**

- Al detectar un archivo en la ubicación configurada, el sistema valida que tenga un cliente destinatario identificado, registra la fecha de detección y lo incorpora a la cola de envíos.

### Validar documentos antes del envío automático

- **Rol:** Personal contable
- **Prioridad:** Crítica
- **Formato:** Como **Personal contable**, quiero **revisar los documentos que el sistema ha preparado para envío antes de que sean enviados** para **pueda corregir destinatarios, archivos o datos incompletos y evitar envíos erróneos**.

**Criterios de aceptación:**

- La cola muestra destinatario, asunto, archivo adjunto, fecha de preparación y estado. Los documentos con destinatario ambiguo, correo inválido o archivo faltante quedan bloqueados para revisión.

### Consultar el estado de los envíos

- **Rol:** Personal contable
- **Prioridad:** Alta
- **Formato:** Como **Personal contable**, quiero **consultar el estado de cada documento enviado automáticamente** para **pueda confirmar la entrega o actuar ante fallos de envío**.

**Criterios de aceptación:**

- El sistema distingue al menos los estados pendiente, enviado, fallido y bloqueado para revisión, mostrando fecha, destinatario, motivo del fallo y opción de reintento cuando corresponda.

### Registrar observaciones de revisión

- **Rol:** Personal contable
- **Prioridad:** Media
- **Formato:** Como **Personal contable**, quiero **agregar observaciones al revisar una clasificación o un envío** para **pueda dejar contexto para futuras consultas y mejorar la trazabilidad del proceso**.

**Criterios de aceptación:**

- Puedo añadir, editar y consultar observaciones asociadas al documento, junto con la fecha y el usuario que las registró.

## Casos de uso (13)

### Cargar documentos

- **Rol:** Cliente
- **Prioridad:** Media

Permitir al cliente depositar uno o varios documentos mediante el canal habilitado y registrar su recepción para iniciar el procesamiento automático.

**Pasos:**

1. El cliente accede al canal habilitado.
2. El cliente selecciona uno o varios documentos.
3. El cliente confirma el envío.
4. El sistema valida los archivos y registra el depósito.
5. El sistema asigna un identificador y estado inicial a cada documento.
6. El sistema muestra el resultado de la carga.

### Consultar estado de documentos

- **Rol:** Cliente
- **Prioridad:** Media

Permitir al cliente consultar el estado actualizado de sus documentos enviados durante las etapas de recepción, revisión, clasificación y procesamiento.

**Pasos:**

1. El cliente accede a la consulta de documentos.
2. El sistema autentica al cliente.
3. El cliente filtra o selecciona los documentos enviados.
4. El sistema muestra el estado actual de cada documento.
5. El sistema presenta, cuando corresponda, la fecha de actualización y los detalles del estado.

### Recibir confirmación de recepción

- **Rol:** Cliente
- **Prioridad:** Media

Informar al cliente que sus documentos fueron recibidos correctamente por el sistema y proporcionar el detalle del depósito realizado.

**Pasos:**

1. El sistema finaliza la validación inicial de los documentos cargados.
2. El sistema confirma cuáles documentos fueron recibidos correctamente.
3. El sistema genera una notificación de recepción con los identificadores y la fecha del depósito.
4. El sistema envía la confirmación al canal de notificación configurado del cliente.
5. El cliente consulta la confirmación recibida.

### Recibir documentos procesados

- **Rol:** Cliente
- **Prioridad:** Media

Enviar automáticamente al cliente por correo electrónico los documentos que el despacho haya procesado y depositado en las carpetas designadas.

**Pasos:**

1. El sistema detecta que un documento fue marcado como procesado.
2. El sistema verifica el destinatario y los documentos asociados al cliente.
3. El sistema prepara el correo electrónico con los documentos procesados.
4. El sistema envía el correo al cliente.
5. El sistema registra el envío y actualiza el estado de entrega.
6. El cliente recibe los documentos procesados en su correo electrónico.

### Consultar historial de documentos y envíos

- **Rol:** Cliente
- **Prioridad:** Media

Permitir al cliente revisar el historial de sus documentos depositados y de las comunicaciones o envíos realizados por el sistema.

**Pasos:**

1. El cliente accede al historial.
2. El sistema autentica al cliente.
3. El cliente define filtros o un rango de fechas, si lo requiere.
4. El sistema muestra los documentos depositados y los envíos asociados exclusivamente al cliente.
5. El cliente consulta el detalle de un registro.
6. El sistema presenta fechas, estados, destinatarios y resultado del envío cuando estén disponibles.

### Recibir notificaciones de incidencias documentales

- **Rol:** Cliente
- **Prioridad:** Media

Notificar al cliente cuando un documento no pueda clasificarse, procesarse o enviarse correctamente, incluyendo la causa o acción requerida cuando esté disponible.

**Pasos:**

1. El sistema detecta un error o una revisión requerida durante la clasificación, el procesamiento o el envío.
2. El sistema registra la incidencia asociada al documento.
3. El sistema determina el cliente afectado y el canal de notificación configurado.
4. El sistema envía una notificación con el documento involucrado, el tipo de incidencia y su estado.
5. El cliente recibe y consulta la notificación.
6. El sistema actualiza la incidencia cuando se resuelva o cambie su estado.

### Consultar y descargar documentos propios

- **Rol:** Cliente
- **Prioridad:** Media

Permitir al cliente acceder de forma segura únicamente a sus documentos y notificaciones, así como descargarlos cuando corresponda.

**Pasos:**

1. El cliente inicia sesión en el sistema.
2. El sistema autentica al cliente y valida sus permisos.
3. El cliente selecciona un documento o notificación propios.
4. El sistema verifica que el recurso pertenezca al cliente.
5. El sistema muestra el recurso o habilita su descarga.
6. El sistema registra el acceso o la descarga realizada.

### Consultar documentos clasificados

- **Rol:** Personal contable
- **Prioridad:** Media

Permitir al personal contable localizar y consultar los documentos que el sistema clasificó y organizó por cliente y carpeta.

**Pasos:**

1. El personal contable solicita consultar los documentos clasificados.
2. El sistema muestra los filtros disponibles, como cliente, carpeta, fecha y tipo de documento.
3. El personal contable aplica los filtros o selecciona un cliente y carpeta.
4. El sistema presenta los documentos clasificados que coinciden con los criterios.
5. El personal contable selecciona un documento.
6. El sistema muestra la información del documento y permite visualizarlo o descargarlo.

### Gestionar clasificaciones pendientes de revisión

- **Rol:** Personal contable
- **Prioridad:** Media

Permitir revisar documentos con baja confianza y confirmar o corregir la clasificación sugerida, registrando las observaciones correspondientes.

**Pasos:**

1. El personal contable accede a la bandeja de documentos con clasificación pendiente de revisión.
2. El sistema muestra los documentos, la clasificación sugerida, el nivel de confianza y los datos identificados.
3. El personal contable selecciona un documento para revisarlo.
4. El sistema muestra el documento y las opciones de cliente y carpeta disponibles.
5. El personal contable confirma la clasificación sugerida o selecciona un cliente y carpeta diferentes.
6. El personal contable registra una observación de revisión, si corresponde.
7. El personal contable confirma la decisión.
8. El sistema actualiza la clasificación, mueve el documento a la ubicación correspondiente y registra la revisión y sus observaciones.

### Gestionar errores de procesamiento

- **Rol:** Personal contable
- **Prioridad:** Media

Permitir identificar y resolver archivos que no pudieron ser leídos, clasificados o movidos durante el procesamiento automático.

**Pasos:**

1. El personal contable consulta la bandeja de errores de procesamiento.
2. El sistema muestra los archivos con error, la etapa afectada, el motivo y la fecha del incidente.
3. El personal contable selecciona un archivo con error.
4. El sistema muestra el archivo, el detalle técnico o funcional del error y las acciones disponibles.
5. El personal contable corrige la información necesaria, asigna manualmente el cliente y la carpeta, o solicita un reprocesamiento.
6. El sistema valida la acción seleccionada y reprocesa o mueve el archivo según corresponda.
7. El sistema actualiza el estado del archivo y registra la solución aplicada.

### Preparar documentos para envío automático

- **Rol:** Personal contable
- **Prioridad:** Media

Permitir depositar documentos procesados en el estado de listo para envío y validarlos antes de su envío automático al cliente.

**Pasos:**

1. El personal contable selecciona uno o más documentos procesados.
2. El personal contable los deposita en la carpeta o estado de listo para envío.
3. El sistema valida que cada documento esté asociado a un cliente y tenga los datos necesarios para el envío.
4. El sistema incorpora los documentos válidos a la bandeja de preparados para envío.
5. El personal contable consulta la bandeja de documentos preparados.
6. El sistema muestra el destinatario, los documentos adjuntos y la información del envío.
7. El personal contable revisa el contenido y confirma que los documentos están listos para enviarse, o registra una observación y retira un documento para corrección.
8. El sistema actualiza el estado de cada documento y envía automáticamente los documentos aprobados según la configuración establecida.

### Consultar historial de procesamiento

- **Rol:** Personal contable
- **Prioridad:** Media

Permitir consultar el historial de clasificación, revisión, corrección y movimientos realizados sobre los documentos.

**Pasos:**

1. El personal contable solicita el historial de procesamiento.
2. El sistema muestra filtros por documento, cliente, tipo de evento, usuario, estado y rango de fechas.
3. El personal contable aplica los filtros deseados.
4. El sistema presenta la secuencia de eventos y movimientos asociados a cada documento.
5. El personal contable selecciona un evento para consultar su detalle.
6. El sistema muestra la fecha, el usuario o proceso que ejecutó la acción, el estado anterior, el estado posterior y las observaciones registradas.

### Consultar estado de envíos automáticos

- **Rol:** Personal contable
- **Prioridad:** Media

Permitir consultar el estado y detalle de cada documento enviado automáticamente a los clientes.

**Pasos:**

1. El personal contable accede al módulo de estado de envíos.
2. El sistema muestra filtros por cliente, documento, fecha y estado del envío.
3. El personal contable aplica los filtros o selecciona un cliente.
4. El sistema presenta los documentos y su estado, como preparado, enviado, entregado, fallido o pendiente.
5. El personal contable selecciona un envío.
6. El sistema muestra el destinatario, la fecha y hora, los documentos incluidos, el resultado del envío y los errores o observaciones asociados.

## Modelo de datos (26 objetos)

### Documento

Archivo depositado, procesado o enviado dentro del sistema documental.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único del documento. |
| clienteId | uuid | — | Sí | Identificador del cliente al que pertenece el documento. |
| nombreArchivo | text | — | Sí | Nombre original del archivo depositado. |
| tipoMime | text | — | Sí | Tipo MIME del archivo. |
| tamanoBytes | number | — | Sí | Tamaño del archivo expresado en bytes. |
| rutaAlmacenamiento | url | — | Sí | Ubicación segura del archivo almacenado. |
| estado | text | — | Sí | Estado actual del documento dentro del flujo documental. |
| creadoEn | datetime | — | Sí | Fecha y hora de recepción del documento. |

### Clasificación documental

Resultado de la identificación automática de un documento y su asignación a un cliente o carpeta.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único de la clasificación. |
| documentoId | uuid | — | Sí | Identificador del documento clasificado. |
| clienteId | uuid | — | Sí | Identificador del cliente identificado para el documento. |
| carpetaDestino | text | — | Sí | Carpeta asignada al documento. |
| nivelConfianza | decimal | — | Sí | Nivel de confianza del resultado automático de clasificación. |
| estadoRevision | text | — | Sí | Estado de revisión o validación de la clasificación. |
| observaciones | textarea | — | — | Comentarios sobre la clasificación o sus correcciones. |
| clasificadoEn | datetime | — | Sí | Fecha y hora en que se generó la clasificación. |

### Procesamiento documental

Ejecución del análisis y tratamiento aplicado a un documento recibido.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único de la ejecución de procesamiento. |
| documentoId | uuid | — | Sí | Identificador del documento procesado. |
| tipoProceso | text | — | Sí | Tipo de análisis o tratamiento aplicado al documento. |
| estado | text | — | Sí | Estado de la ejecución del procesamiento. |
| iniciadoEn | datetime | — | Sí | Fecha y hora de inicio del procesamiento. |
| finalizadoEn | datetime | — | — | Fecha y hora de finalización del procesamiento. |
| mensajeError | textarea | — | — | Detalle del error ocurrido durante el procesamiento. |
| resultadoResumen | textarea | — | — | Resumen del resultado obtenido durante el procesamiento. |

### Revisión documental

Evaluación manual de una clasificación o documento que requiere validación del personal contable.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único de la revisión documental. |
| documentoId | uuid | — | Sí | Identificador del documento sometido a revisión. |
| revisorId | uuid | — | Sí | Identificador del miembro del personal contable que realiza la revisión. |
| estado | text | — | Sí | Estado de la revisión, por ejemplo pendiente, confirmada o corregida. |
| clasificacionPropuesta | text | — | — | Clasificación asignada automáticamente al documento. |
| clasificacionConfirmada | text | — | — | Clasificación validada o corregida por el revisor. |
| observaciones | textarea | — | — | Comentarios y observaciones registrados durante la revisión. |
| fechaRevision | datetime | — | — | Fecha y hora en que se completó la revisión. |

### Incidencia documental

Situación anómala detectada durante la recepción, clasificación o procesamiento de un documento.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único de la incidencia documental. |
| documentoId | uuid | — | Sí | Identificador del documento relacionado con la incidencia. |
| tipo | text | — | Sí | Tipo de incidencia detectada, como error de procesamiento, baja confianza o clasificación incorrecta. |
| descripcion | textarea | — | Sí | Descripción detallada de la situación anómala. |
| estado | text | — | Sí | Estado de la incidencia, por ejemplo abierta, en gestión o resuelta. |
| severidad | text | — | Sí | Nivel de impacto o prioridad de la incidencia. |
| fechaDeteccion | datetime | — | Sí | Fecha y hora en que se detectó la incidencia. |
| fechaResolucion | datetime | — | — | Fecha y hora en que se resolvió la incidencia. |

### Envío automático

Operación de entrega por correo electrónico de documentos procesados a sus destinatarios.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único del envío automático. |
| documentoId | uuid | — | Sí | Identificador del documento enviado. |
| destinatarioEmail | email | — | Sí | Dirección de correo electrónico del cliente destinatario. |
| asunto | text | — | Sí | Asunto del correo electrónico enviado. |
| estado | text | — | Sí | Estado del envío, por ejemplo preparado, enviado, entregado o fallido. |
| fechaProgramada | datetime | — | — | Fecha y hora previstas para el envío. |
| fechaEnvio | datetime | — | — | Fecha y hora en que se realizó el envío. |
| detalleError | textarea | — | — | Detalle del error cuando el envío no se completa correctamente. |

### Confirmación de recepción

Constancia generada para informar que un documento fue recibido por el sistema.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único de la confirmación. |
| documentName | text | — | Sí | Nombre del documento recibido. |
| receivedAt | datetime | — | Sí | Fecha y hora de recepción del documento. |
| confirmationStatus | text | — | Sí | Estado de la confirmación, como generada, enviada o fallida. |
| recipientEmail | email | — | Sí | Correo electrónico del destinatario de la confirmación. |
| referenceCode | text | — | Sí | Código de referencia para consultar la recepción. |

### Notificación documental

Aviso dirigido a un usuario sobre la recepción, procesamiento, revisión, error o envío de un documento.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único de la notificación. |
| notificationType | text | — | Sí | Tipo de aviso, como recepción, procesamiento, revisión, error o envío. |
| title | text | — | Sí | Título breve de la notificación. |
| message | textarea | — | Sí | Contenido descriptivo del aviso. |
| createdAt | datetime | — | Sí | Fecha y hora de creación de la notificación. |
| isRead | boolean | — | Sí | Indica si el destinatario ya leyó la notificación. |
| recipientEmail | email | — | Sí | Correo electrónico del usuario destinatario. |

### Carpeta documental

Ubicación lógica destinada a organizar documentos según el cliente y su clasificación.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único de la carpeta documental. |
| folderName | text | — | Sí | Nombre de la carpeta. |
| folderPath | text | — | Sí | Ruta lógica o física de almacenamiento de la carpeta. |
| classificationType | text | — | Sí | Tipo de clasificación documental asignada a la carpeta. |
| isActive | boolean | — | Sí | Indica si la carpeta está disponible para organizar documentos. |
| createdAt | datetime | — | Sí | Fecha y hora de creación de la carpeta. |

### Documento

Archivo depositado, procesado o enviado dentro del sistema documental.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único del documento. |
| fileName | text | — | Sí | Nombre original del archivo depositado. |
| fileUrl | url | — | Sí | Ubicación segura del archivo en el almacenamiento documental. |
| fileType | text | — | Sí | Tipo o extensión del archivo. |
| status | text | — | Sí | Estado actual del documento, como recibido, procesado, enviado o con error. |
| uploadedAt | datetime | — | Sí | Fecha y hora de recepción del documento. |
| clientId | uuid | — | Sí | Identificador del cliente al que pertenece el documento. |

### Clasificación documental

Resultado de la identificación automática de un documento y su asignación a un cliente o carpeta.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único de la clasificación. |
| documentId | uuid | — | Sí | Identificador del documento clasificado. |
| clientId | uuid | — | — | Cliente identificado como destinatario o propietario del documento. |
| folderName | text | — | Sí | Nombre de la carpeta asignada al documento. |
| classificationStatus | text | — | Sí | Estado de la clasificación, como automática, pendiente de revisión, confirmada o corregida. |
| confidenceScore | decimal | — | — | Nivel de confianza de la clasificación automática. |
| reviewComment | textarea | — | — | Comentario asociado a la revisión o corrección de la clasificación. |

### Procesamiento documental

Ejecución del análisis y tratamiento aplicado a un documento recibido.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único de la ejecución de procesamiento. |
| documentId | uuid | — | Sí | Identificador del documento procesado. |
| processingType | text | — | Sí | Tipo de tratamiento aplicado, como análisis, clasificación, validación o preparación para envío. |
| status | text | — | Sí | Estado del procesamiento, como iniciado, completado o fallido. |
| startedAt | datetime | — | Sí | Fecha y hora de inicio del procesamiento. |
| completedAt | datetime | — | — | Fecha y hora de finalización del procesamiento. |
| errorMessage | textarea | — | — | Detalle del error ocurrido durante el procesamiento. |

### Revisión documental

Evaluación manual de una clasificación o documento que requiere validación del personal contable.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único de la revisión documental. |
| documentId | uuid | — | Sí | Identificador del documento cuya clasificación requiere validación. |
| confidenceScore | decimal | — | — | Nivel de confianza de la clasificación automática. |
| reviewStatus | text | — | Sí | Estado de la revisión: pendiente, confirmada o corregida. |
| reviewerId | uuid | — | — | Identificador del usuario del personal contable que realizó la revisión. |
| observations | textarea | — | — | Observaciones registradas durante la revisión. |
| reviewedAt | datetime | — | — | Fecha y hora en que se completó la revisión. |

### Incidencia documental

Situación anómala detectada durante la recepción, clasificación o procesamiento de un documento.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único de la incidencia documental. |
| documentId | uuid | — | Sí | Identificador del documento afectado por la incidencia. |
| incidentType | text | — | Sí | Tipo de incidencia detectada durante la recepción, clasificación o procesamiento. |
| description | textarea | — | Sí | Detalle de la situación anómala detectada. |
| severity | text | — | Sí | Nivel de severidad de la incidencia. |
| status | text | — | Sí | Estado de la incidencia: abierta, en gestión o resuelta. |
| detectedAt | datetime | — | Sí | Fecha y hora en que se detectó la incidencia. |
| resolvedAt | datetime | — | — | Fecha y hora en que se resolvió la incidencia. |

### Envío automático

Operación de entrega por correo electrónico de documentos procesados a sus destinatarios.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único del envío automático. |
| documentId | uuid | — | Sí | Identificador del documento procesado que se enviará. |
| recipientEmail | email | — | Sí | Correo electrónico del destinatario del documento. |
| status | text | — | Sí | Estado del envío: preparado, pendiente, enviado o fallido. |
| preparedAt | datetime | — | Sí | Fecha y hora en que el documento quedó preparado para envío. |
| sentAt | datetime | — | — | Fecha y hora en que el correo fue enviado correctamente. |
| errorMessage | textarea | — | — | Detalle del error ocurrido durante el envío, si aplica. |

### Confirmación de recepción

Constancia generada para informar que un documento fue recibido por el sistema.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único de la confirmación. |
| documentId | uuid | — | Sí | Identificador del documento recibido. |
| receivedAt | datetime | — | Sí | Fecha y hora en que el sistema recibió el documento. |
| confirmationStatus | text | — | Sí | Estado de la confirmación de recepción. |
| message | textarea | — | — | Detalle informativo asociado a la recepción. |

### Notificación documental

Aviso dirigido a un usuario sobre la recepción, procesamiento, revisión, error o envío de un documento.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único de la notificación. |
| documentId | uuid | — | — | Identificador del documento relacionado. |
| notificationType | text | — | Sí | Tipo de notificación, como recepción, procesamiento, revisión, error o envío. |
| recipientEmail | email | — | Sí | Correo electrónico del destinatario. |
| subject | text | — | Sí | Asunto de la notificación. |
| message | textarea | — | Sí | Contenido de la notificación. |
| sentAt | datetime | — | — | Fecha y hora en que se envió la notificación. |
| status | text | — | Sí | Estado del envío de la notificación. |

### Carpeta documental

Ubicación lógica destinada a organizar documentos según el cliente y su clasificación.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único de la carpeta. |
| clientIdentifier | text | — | Sí | Identificador del cliente al que pertenece la carpeta. |
| folderName | text | — | Sí | Nombre de la carpeta documental. |
| folderPath | text | — | Sí | Ruta o ubicación lógica de la carpeta. |
| classification | text | — | Sí | Categoría documental asociada a la carpeta. |
| isActive | boolean | — | Sí | Indica si la carpeta está habilitada para recibir documentos. |

### Cliente

Entidad receptora y propietaria de los documentos depositados o procesados en el sistema.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único del cliente. |
| razonSocial | text | — | Sí | Nombre legal o comercial del cliente. |
| identificadorFiscal | text | — | — | Identificador fiscal utilizado para reconocer y clasificar documentos. |
| emailNotificaciones | email | — | Sí | Correo principal para recibir confirmaciones y documentos procesados. |
| telefono | phone | — | — | Teléfono de contacto del cliente. |
| estado | text | — | Sí | Estado operativo del cliente, por ejemplo activo o inactivo. |

### Cuenta de acceso

Entidad que representa el acceso autenticado y autorizado de una persona al sistema.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único de la cuenta de acceso. |
| clienteId | uuid | — | — | Cliente asociado a la cuenta cuando el usuario pertenece a un cliente. |
| nombreCompleto | text | — | Sí | Nombre de la persona titular de la cuenta. |
| email | email | — | Sí | Correo utilizado para autenticación y comunicaciones. |
| rol | text | — | Sí | Rol de autorización de la cuenta, como cliente o personal contable. |
| estado | text | — | Sí | Estado de la cuenta, por ejemplo activa, bloqueada o suspendida. |
| ultimoAcceso | datetime | — | — | Fecha y hora del último acceso autenticado. |

### Lote documental

Conjunto de documentos depositados o preparados conjuntamente para su procesamiento y seguimiento.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único del lote documental. |
| clienteId | uuid | — | Sí | Cliente propietario o destinatario del lote. |
| creadoPorCuentaId | uuid | — | Sí | Cuenta que depositó o preparó el lote. |
| nombre | text | — | Sí | Nombre descriptivo del lote. |
| estado | text | — | Sí | Estado actual del lote dentro del flujo de recepción, procesamiento o envío. |
| cantidadDocumentos | number | — | Sí | Cantidad de documentos incluidos en el lote. |
| fechaRecepcion | datetime | — | Sí | Fecha y hora en que el lote fue recibido por el sistema. |
| fechaCierre | datetime | — | — | Fecha y hora en que finalizó el procesamiento o preparación del lote. |

### Regla de clasificación

Criterio utilizado para determinar el cliente y la carpeta documental que corresponden a un documento.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único de la regla de clasificación. |
| nombre | text | — | Sí | Nombre descriptivo de la regla. |
| descripcion | textarea | — | — | Explicación del criterio utilizado para clasificar documentos. |
| criterio | textarea | — | Sí | Condición o patrón que debe cumplir un documento. |
| carpetaDestino | text | — | Sí | Carpeta documental asignada cuando se cumple la regla. |
| activa | boolean | — | Sí | Indica si la regla se encuentra habilitada para el procesamiento automático. |

### Estado documental

Representación del estado actual y de las transiciones por las que atraviesa un documento durante su ciclo de vida.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único del estado documental. |
| codigo | text | — | Sí | Código interno del estado. |
| nombre | text | — | Sí | Nombre visible del estado del documento. |
| descripcion | textarea | — | — | Descripción del significado del estado. |
| esFinal | boolean | — | Sí | Indica si el estado representa la finalización del ciclo documental. |
| ordenFlujo | number | — | Sí | Orden del estado dentro del flujo de procesamiento. |

### Observación de revisión

Registro de comentarios y justificaciones realizadas durante la revisión o corrección de una clasificación o incidencia.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único de la observación. |
| documentId | uuid | — | Sí | Identificador del documento asociado a la revisión. |
| tipo | text | — | Sí | Tipo de observación, como revisión, corrección o incidencia. |
| comentario | textarea | — | Sí | Comentario o justificación registrada durante la revisión. |
| autor | text | — | Sí | Nombre o referencia del usuario que registró la observación. |
| creadoEn | datetime | — | Sí | Fecha y hora de creación de la observación. |
| resuelta | boolean | — | Sí | Indica si la observación o incidencia fue resuelta. |

### Destinatario de envío

Entidad que identifica al receptor previsto de un documento procesado enviado automáticamente.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único del destinatario. |
| nombre | text | — | Sí | Nombre completo o razón social del receptor. |
| email | email | — | Sí | Dirección de correo electrónico para recibir documentos procesados. |
| tipoRol | text | — | Sí | Rol del destinatario, como Cliente o Personal contable. |
| activo | boolean | — | Sí | Indica si el destinatario está habilitado para envíos automáticos. |

### Historial documental

Registro consolidado de eventos relevantes asociados con la recepción, clasificación, procesamiento y envío de documentos.

| Campo | Tipo | PK | Requerido | Descripción |
| --- | --- | --- | --- | --- |
| id | uuid | Sí | Sí | Identificador único del registro histórico. |
| nombreArchivo | text | — | Sí | Nombre del archivo involucrado en el evento. |
| tipoEvento | text | — | Sí | Tipo de evento registrado, como recepción, clasificación, procesamiento o envío. |
| estado | text | — | Sí | Estado resultante del documento o del envío. |
| fechaEvento | datetime | — | Sí | Fecha y hora en que ocurrió el evento. |
| destinatarioId | uuid | — | — | Identificador del destinatario asociado al documento o envío. |
| detalle | textarea | — | — | Descripción adicional del procesamiento, validación, clasificación o error. |

### Relaciones

- **Cliente** → **Cuenta de acceso** (one-to-many): dispone de
- **Cliente** → **Lote documental** (one-to-many): posee
- **Cliente** → **Regla de clasificación** (one-to-many): define
- **Cliente** → **Destinatario de envío** (one-to-many): configura
- **Lote documental** → **Historial documental** (one-to-many): genera
- **Regla de clasificación** → **Observación de revisión** (one-to-many): es revisada mediante
- **Cuenta de acceso** → **Observación de revisión** (one-to-many): registra
- **Estado documental** → **Historial documental** (one-to-many): se refleja en
- **Destinatario de envío** → **Historial documental** (one-to-many): participa en

## Épicas (2)

### Cliente

- **Estado:** Abierta
- **Prioridad:** Media

Implementar capacidades para el rol Cliente.

**Tickets (13):** Implementar: Recibir documentos procesados automáticamente; Implementar: Recibir confirmación de recepción; Backend: Consultar estado de documentos; Backend: Consultar y descargar documentos propios; Backend: Cargar documentos; Backend: Recibir confirmación de recepción; Backend: Recibir notificaciones de incidencias documentales; Implementar: Consultar el estado de los documentos enviados; Backend: Consultar historial de documentos y envíos; Backend: Recibir documentos procesados; Implementar: Acceder de forma segura a los documentos; Implementar: Recibir notificaciones de errores o revisiones; Implementar: Consultar el historial de documentos y envíos

### Personal contable

- **Estado:** Abierta
- **Prioridad:** Media

Implementar capacidades para el rol Personal contable.

**Tickets (14):** Backend: Consultar documentos clasificados; Backend: Preparar documentos para envío automático; Backend: Consultar estado de envíos automáticos; Backend: Gestionar errores de procesamiento; Backend: Consultar historial de procesamiento; Implementar: Revisar documentos con baja confianza; Backend: Gestionar clasificaciones pendientes de revisión; Implementar: Validar documentos antes del envío automático; Implementar: Corregir errores de procesamiento; Implementar: Registrar observaciones de revisión; Implementar: Consultar el historial de procesamiento; Implementar: Consultar el estado de los envíos; Implementar: Depositar documentos procesados para envío; Implementar: Confirmar o corregir la clasificación

## Backlog de tickets (27)

### Cliente

- **[Backlog]** Implementar: Recibir documentos procesados automáticamente _(task, Media)_
  - Rol: Cliente · HU: Recibir documentos procesados automáticamente
  - Implementación: Frontend
- **[Backlog]** Implementar: Recibir confirmación de recepción _(task, Media)_
  - Rol: Cliente · HU: Recibir confirmación de recepción
  - Implementación: Frontend
- **[Backlog]** Backend: Consultar estado de documentos _(task, Alta)_
  - Rol: Cliente · HU: Depositar documentos en el sistema
  - Implementación: Backend
- **[Backlog]** Backend: Consultar y descargar documentos propios _(task, Alta)_
  - Rol: Cliente · HU: Depositar documentos en el sistema
  - Implementación: Backend
- **[Backlog]** Backend: Cargar documentos _(task, Alta)_
  - Rol: Cliente · HU: Depositar documentos en el sistema
  - Implementación: Backend
- **[Backlog]** Backend: Recibir confirmación de recepción _(task, Alta)_
  - Rol: Cliente · HU: Depositar documentos en el sistema
  - Implementación: Backend
- **[Backlog]** Backend: Recibir notificaciones de incidencias documentales _(task, Alta)_
  - Rol: Cliente · HU: Depositar documentos en el sistema
  - Implementación: Backend
- **[Backlog]** Implementar: Consultar el estado de los documentos enviados _(task, Media)_
  - Rol: Cliente · HU: Consultar el estado de los documentos enviados
  - Implementación: Frontend
- **[Backlog]** Backend: Consultar historial de documentos y envíos _(task, Alta)_
  - Rol: Cliente · HU: Depositar documentos en el sistema
  - Implementación: Backend
- **[Backlog]** Backend: Recibir documentos procesados _(task, Alta)_
  - Rol: Cliente · HU: Depositar documentos en el sistema
  - Implementación: Backend
- **[Backlog]** Implementar: Acceder de forma segura a los documentos _(task, Media)_
  - Rol: Cliente · HU: Acceder de forma segura a los documentos
  - Implementación: Frontend
- **[Backlog]** Implementar: Recibir notificaciones de errores o revisiones _(task, Media)_
  - Rol: Cliente · HU: Recibir notificaciones de errores o revisiones
  - Implementación: Frontend
- **[Backlog]** Implementar: Consultar el historial de documentos y envíos _(task, Media)_
  - Rol: Cliente · HU: Consultar el historial de documentos y envíos
  - Implementación: Frontend

### Personal contable

- **[Backlog]** Backend: Consultar documentos clasificados _(task, Alta)_
  - Rol: Personal contable · HU: Consultar documentos clasificados
  - Implementación: Backend
- **[Backlog]** Backend: Preparar documentos para envío automático _(task, Alta)_
  - Rol: Personal contable · HU: Consultar documentos clasificados
  - Implementación: Backend
- **[Backlog]** Backend: Consultar estado de envíos automáticos _(task, Alta)_
  - Rol: Personal contable · HU: Consultar documentos clasificados
  - Implementación: Backend
- **[Backlog]** Backend: Gestionar errores de procesamiento _(task, Alta)_
  - Rol: Personal contable · HU: Consultar documentos clasificados
  - Implementación: Backend
- **[Backlog]** Backend: Consultar historial de procesamiento _(task, Alta)_
  - Rol: Personal contable · HU: Consultar documentos clasificados
  - Implementación: Backend
- **[Backlog]** Implementar: Revisar documentos con baja confianza _(task, Media)_
  - Rol: Personal contable · HU: Revisar documentos con baja confianza
  - Implementación: Frontend
- **[Backlog]** Backend: Gestionar clasificaciones pendientes de revisión _(task, Alta)_
  - Rol: Personal contable · HU: Consultar documentos clasificados
  - Implementación: Backend
- **[Backlog]** Implementar: Validar documentos antes del envío automático _(task, Media)_
  - Rol: Personal contable · HU: Validar documentos antes del envío automático
  - Implementación: Frontend
- **[Backlog]** Implementar: Corregir errores de procesamiento _(task, Media)_
  - Rol: Personal contable · HU: Corregir errores de procesamiento
  - Implementación: Frontend
- **[Backlog]** Implementar: Registrar observaciones de revisión _(task, Media)_
  - Rol: Personal contable · HU: Registrar observaciones de revisión
  - Implementación: Frontend
- **[Backlog]** Implementar: Consultar el historial de procesamiento _(task, Media)_
  - Rol: Personal contable · HU: Consultar el historial de procesamiento
  - Implementación: Frontend
- **[Backlog]** Implementar: Consultar el estado de los envíos _(task, Media)_
  - Rol: Personal contable · HU: Consultar el estado de los envíos
  - Implementación: Frontend
- **[Backlog]** Implementar: Depositar documentos procesados para envío _(task, Media)_
  - Rol: Personal contable · HU: Depositar documentos procesados para envío
  - Implementación: Frontend
- **[Backlog]** Implementar: Confirmar o corregir la clasificación _(task, Media)_
  - Rol: Personal contable · HU: Confirmar o corregir la clasificación
  - Implementación: Frontend

---

_Fin de la especificación._