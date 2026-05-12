-- =============================================================================
-- 0003_seed_tipos_gestion.sql — Seed de los 6 tipos de gestión
-- =============================================================================
-- Los fields_schema reflejan lo definido en el doc "Formularios — Fields schema"
-- en Outline. Acá va una versión mínima; los detalles UI vienen de allí.
-- =============================================================================

insert into tipos_gestion (slug, name, description, icon, sort_order, fields_schema, admin_fields_schema, odoo_mapping) values
(
  'pago_factura',
  'Pago de factura',
  'Solicitud para pagar una factura de proveedor (~90% del volumen)',
  'FileText',
  1,
  jsonb_build_object(
    'version', 1,
    'sections', jsonb_build_array(
      jsonb_build_object('id','contexto','title','Contexto del gasto','fields', jsonb_build_array(
        jsonb_build_object('id','codigo_proyecto','label','Código de Proyecto','type','select_analytic','required',true),
        jsonb_build_object('id','fuente_financiamiento','label','Fuente de Financiamiento','type','autofill','required',true),
        jsonb_build_object('id','institucion','label','Institución a la que se afecta el gasto','type','autofill','required',true)
      )),
      jsonb_build_object('id','comprobante','title','Datos del comprobante','fields', jsonb_build_array(
        jsonb_build_object('id','tipo_comprobante','label','Tipo de comprobante','type','select_odoo','options_source','odoo_doc_types','required',true,'ai_extract','qr_afip.cbte_tipo'),
        jsonb_build_object('id','numero_comprobante','label','Número de comprobante','type','text','required',true,'pattern','^\d{1,5}-\d{1,8}$','ai_extract','qr_afip.pto_vta+cbte_nro'),
        jsonb_build_object('id','fecha_factura','label','Fecha de la factura','type','date','required',true,'ai_extract','qr_afip.fecha'),
        jsonb_build_object('id','importe_total','label','Importe total','type','currency','required',true,'ai_extract','qr_afip.imp_total'),
        jsonb_build_object('id','moneda','label','Moneda','type','select','required',true,'default','ARS','options',array['ARS','USD','EUR'])
      )),
      jsonb_build_object('id','proveedor','title','Datos del proveedor','fields', jsonb_build_array(
        jsonb_build_object('id','proveedor_cuit','label','CUIT del proveedor','type','text','required',true,'pattern','^\d{2}-?\d{8}-?\d{1}$','ai_extract','qr_afip.cuit_emisor'),
        jsonb_build_object('id','proveedor_nombre','label','Razón social','type','text','required',true,'ai_extract','padron_afip.razon_social'),
        jsonb_build_object('id','proveedor_cbu','label','CBU para pago','type','text','pattern','^\d{22}$','ai_extract','pdf.cbu')
      )),
      jsonb_build_object('id','lineas','title','Detalle de la factura','fields', jsonb_build_array(
        jsonb_build_object('id','lineas','label','Líneas','type','table','required',true,'min_rows',1,'columns', jsonb_build_array(
          jsonb_build_object('id','partida','label','Partida Presupuestaria','type','select','required',true,'options_depends_on','fuente_financiamiento'),
          jsonb_build_object('id','actividad','label','Actividad','type','text'),
          jsonb_build_object('id','concepto','label','Concepto / producto','type','select_odoo','options_source','odoo_products','filter','categ_name ilike %G3%','required',true),
          jsonb_build_object('id','descripcion','label','Descripción','type','text'),
          jsonb_build_object('id','cantidad','label','Cantidad','type','number','default',1),
          jsonb_build_object('id','precio_unit','label','Precio unitario','type','currency','required',true),
          jsonb_build_object('id','subtotal','label','Subtotal','type','calc','formula','cantidad*precio_unit')
        ))
      )),
      jsonb_build_object('id','adjuntos','title','Adjuntos','fields', jsonb_build_array(
        jsonb_build_object('id','factura_pdf','label','PDF de la factura','type','file','required',true,'max_mb',4,'mime','application/pdf'),
        jsonb_build_object('id','autorizacion_pdf','label','Nota de autorización firmada','type','file','required',true,'max_mb',4,'mime','application/pdf'),
        jsonb_build_object('id','adjuntos_extra','label','Otros adjuntos','type','file_multi','max_mb',4)
      ))
    )
  ),
  jsonb_build_object(
    'fields', jsonb_build_array(
      jsonb_build_object('id','cuenta_contable','label','Cuenta contable','type','select_odoo','options_source','odoo_accounts','default_code','211401','required',true),
      jsonb_build_object('id','journal_id','label','Diario / cuenta bancaria','type','select_odoo','options_source','odoo_journals','filter','journal_type=bank','required',true),
      jsonb_build_object('id','fecha_vencimiento','label','Fecha de vencimiento','type','date'),
      jsonb_build_object('id','impuestos','label','Impuestos / retenciones','type','select_odoo_multi','options_source','odoo_taxes')
    )
  ),
  jsonb_build_object(
    'model','account.move',
    'extra_fields', jsonb_build_object('move_type','in_invoice')
  )
),
(
  'compra',
  'Solicitud de compra',
  'Compra de bienes, servicios o pasajes (antes de tener factura)',
  'ShoppingCart',
  2,
  jsonb_build_object(
    'version', 1,
    'sections', jsonb_build_array(
      jsonb_build_object('id','contexto','title','Contexto','fields', jsonb_build_array(
        jsonb_build_object('id','codigo_proyecto','label','Código de Proyecto','type','select_analytic','required',true),
        jsonb_build_object('id','fuente_financiamiento','label','Fuente de Financiamiento','type','autofill'),
        jsonb_build_object('id','institucion','label','Institución','type','autofill'),
        jsonb_build_object('id','descripcion_actividad','label','Descripción de la actividad','type','textarea','required',true),
        jsonb_build_object('id','sub_tipo','label','Tipo de compra','type','select','required',true,'options', array['bienes','servicios','pasajes'])
      )),
      jsonb_build_object('id','bienes','title','Bienes, Materiales e Insumos','visible_when','sub_tipo=bienes','fields', jsonb_build_array(
        jsonb_build_object('id','items','type','table','min_rows',1,'columns', jsonb_build_array(
          jsonb_build_object('id','partida','label','Partida','type','select','required',true),
          jsonb_build_object('id','actividad','label','Actividad','type','text'),
          jsonb_build_object('id','descripcion','label','Descripción','type','text','required',true),
          jsonb_build_object('id','cantidad','label','Cantidad','type','number','required',true),
          jsonb_build_object('id','importe_unit','label','Importe x unidad','type','currency','required',true),
          jsonb_build_object('id','moneda','label','Moneda','type','select','default','ARS'),
          jsonb_build_object('id','lugar_entrega','label','Lugar de entrega','type','text'),
          jsonb_build_object('id','persona_recepcion','label','Persona de recepción','type','text')
        ))
      )),
      jsonb_build_object('id','servicios','title','Servicios y Consultorías','visible_when','sub_tipo=servicios','fields', jsonb_build_array(
        jsonb_build_object('id','items','type','table','min_rows',1,'columns', jsonb_build_array(
          jsonb_build_object('id','partida','label','Partida','type','select','required',true),
          jsonb_build_object('id','descripcion','label','Descripción del servicio','type','textarea','required',true),
          jsonb_build_object('id','duracion','label','Duración','type','text'),
          jsonb_build_object('id','cant_pagos','label','Cant de pagos / valor cuota','type','text'),
          jsonb_build_object('id','importe_total','label','Importe total estimado','type','currency','required',true),
          jsonb_build_object('id','condicion_pago','label','Condición de pago / entregables','type','text'),
          jsonb_build_object('id','persona_aprueba','label','Persona que aprueba el servicio','type','text')
        ))
      )),
      jsonb_build_object('id','pasajes','title','Pasajes','visible_when','sub_tipo=pasajes','fields', jsonb_build_array(
        jsonb_build_object('id','items','type','table','min_rows',1,'columns', jsonb_build_array(
          jsonb_build_object('id','tipo_pasaje','label','Tipo de pasaje','type','select','required',true,'options', array['aereo','auto','micro','barco','tren']),
          jsonb_build_object('id','nombre_pasajero','label','Nombre del pasajero','type','text','required',true),
          jsonb_build_object('id','dni_pasajero','label','DNI/Pasaporte','type','text','required',true),
          jsonb_build_object('id','origen','label','Origen','type','text','required',true),
          jsonb_build_object('id','destino','label','Destino','type','text','required',true),
          jsonb_build_object('id','fecha_viaje','label','Fecha de viaje','type','date','required',true),
          jsonb_build_object('id','rango_horario','label','Rango horario','type','text'),
          jsonb_build_object('id','importe','label','Importe estimado','type','currency','required',true)
        ))
      )),
      jsonb_build_object('id','proveedores','title','Proveedores sugeridos (hasta 3)','fields', jsonb_build_array(
        jsonb_build_object('id','proveedores_sugeridos','type','table','max_rows',3,'columns', jsonb_build_array(
          jsonb_build_object('id','razon_social','label','Razón social','type','text'),
          jsonb_build_object('id','cuit','label','CUIT','type','text'),
          jsonb_build_object('id','telefono','label','Teléfono','type','text'),
          jsonb_build_object('id','email','label','E-mail','type','email'),
          jsonb_build_object('id','adjunta_cotizacion','label','Adjunta cotización','type','file')
        ))
      )),
      jsonb_build_object('id','adjuntos','title','Adjuntos','fields', jsonb_build_array(
        jsonb_build_object('id','autorizacion','label','Autorización firmada','type','file','required',true)
      ))
    )
  ),
  jsonb_build_object('fields', jsonb_build_array(
    jsonb_build_object('id','regimen','label','Régimen jurisdiccional','type','calc','formula','calcular_regimen(importe_total)','readonly',true),
    jsonb_build_object('id','proveedor_final','label','Proveedor final','type','select_odoo','options_source','odoo_partners'),
    jsonb_build_object('id','journal_id','label','Diario','type','select_odoo','filter','journal_type=purchase'),
    jsonb_build_object('id','payment_term','label','Condiciones de pago','type','select_odoo')
  )),
  jsonb_build_object('model','purchase.order')
),
(
  'anticipo_rendicion',
  'Anticipo y Rendición',
  'Solicitud de anticipo de fondos. La rendición se completa en el mismo expediente.',
  'Banknote',
  3,
  jsonb_build_object(
    'version', 1,
    'sections', jsonb_build_array(
      jsonb_build_object('id','contexto','title','Contexto','fields', jsonb_build_array(
        jsonb_build_object('id','codigo_proyecto','label','Código de Proyecto','type','select_analytic','required',true),
        jsonb_build_object('id','fuente_financiamiento','label','Fuente de Financiamiento','type','autofill'),
        jsonb_build_object('id','institucion','label','Institución','type','autofill'),
        jsonb_build_object('id','descripcion_actividad','label','Descripción de la actividad','type','textarea','required',true)
      )),
      jsonb_build_object('id','beneficiario','title','Beneficiario','fields', jsonb_build_array(
        jsonb_build_object('id','cuit_cuil','label','CUIT/CUIL','type','text','required',true),
        jsonb_build_object('id','nombre','label','Nombre/Razón social','type','text','required',true),
        jsonb_build_object('id','email','label','E-mail','type','email','required',true),
        jsonb_build_object('id','cbu','label','CBU','type','text','required',true),
        jsonb_build_object('id','es_extranjero','label','Beneficiario extranjero','type','toggle','default',false)
      )),
      jsonb_build_object('id','ficha_internacional','title','Ficha financiera internacional','visible_when','es_extranjero=true','fields', jsonb_build_array(
        jsonb_build_object('id','swift_bic','label','SWIFT/BIC','type','text','required',true),
        jsonb_build_object('id','iban','label','IBAN (UE)','type','text'),
        jsonb_build_object('id','aba','label','ABA (USA)','type','text'),
        jsonb_build_object('id','banco_nombre','label','Banco','type','text','required',true),
        jsonb_build_object('id','banco_sucursal','label','Sucursal / código banco','type','text'),
        jsonb_build_object('id','banco_domicilio','label','Domicilio del banco','type','text'),
        jsonb_build_object('id','banco_ciudad_pais','label','Ciudad / país','type','text','required',true),
        jsonb_build_object('id','tipo_cuenta','label','Tipo de cuenta','type','text'),
        jsonb_build_object('id','moneda_divisa','label','Moneda / divisa','type','text','required',true)
      )),
      jsonb_build_object('id','anticipo','title','Anticipo (qué se pide)','fields', jsonb_build_array(
        jsonb_build_object('id','lineas_anticipo','type','table','min_rows',1,'columns', jsonb_build_array(
          jsonb_build_object('id','concepto','label','Concepto del gasto','type','text','required',true),
          jsonb_build_object('id','partida','label','Partida Presupuestaria','type','select','required',true),
          jsonb_build_object('id','actividad','label','Actividad','type','text'),
          jsonb_build_object('id','importe_pesos','label','Importe en Pesos','type','currency','default',0),
          jsonb_build_object('id','importe_usd','label','Importe en USD/EUR','type','currency','default',0)
        )),
        jsonb_build_object('id','fecha_rendicion_esperada','label','Fecha esperada de rendición','type','date','required',true)
      )),
      jsonb_build_object('id','viaticos','title','Viáticos (solo si aplica)','visible_when','tiene_viaticos=true','fields', jsonb_build_array(
        jsonb_build_object('id','medio_transporte','label','Medio de transporte','type','select','options', array['aereo','auto','micro','barco','tren']),
        jsonb_build_object('id','origen','label','Origen','type','text'),
        jsonb_build_object('id','destino','label','Destino','type','text'),
        jsonb_build_object('id','fecha_origen','label','Fecha origen','type','date'),
        jsonb_build_object('id','fecha_finalizacion','label','Fecha finalización','type','date'),
        jsonb_build_object('id','hora_origen','label','Hora origen','type','time'),
        jsonb_build_object('id','hora_finalizacion','label','Hora finalización','type','time'),
        jsonb_build_object('id','cant_dias','label','Cantidad de días','type','number'),
        jsonb_build_object('id','valor_diario_pesos','label','Valor diario en Pesos','type','currency'),
        jsonb_build_object('id','valor_diario_usd','label','Valor diario en USD/EUR','type','currency'),
        jsonb_build_object('id','moneda_pago','label','Moneda de pago','type','select','options',array['ARS','USD','EUR'])
      )),
      jsonb_build_object('id','rendicion','title','Rendición (cuando se rinde)','editable_when','status=in_progress_rendicion','fields', jsonb_build_array(
        jsonb_build_object('id','lineas_rendidas','type','table','columns', jsonb_build_array(
          jsonb_build_object('id','concepto','label','Concepto del comprobante','type','text','required',true),
          jsonb_build_object('id','partida','label','Partida','type','select','required',true),
          jsonb_build_object('id','actividad','label','Actividad','type','text'),
          jsonb_build_object('id','importe_pesos','label','Importe Pesos','type','currency','default',0),
          jsonb_build_object('id','importe_usd','label','Importe USD/EUR','type','currency','default',0),
          jsonb_build_object('id','nro_comprobante','label','N° de orden de comprobante','type','text','required',true),
          jsonb_build_object('id','fecha_comprobante','label','Fecha del comprobante','type','date','required',true),
          jsonb_build_object('id','comprobante_pdf','label','Comprobante (PDF)','type','file','required',true)
        )),
        jsonb_build_object('id','monto_rendido_calc','label','Monto rendido','type','calc','readonly',true),
        jsonb_build_object('id','diferencia_calc','label','Diferencia (a reintegrar o devolver)','type','calc','readonly',true)
      )),
      jsonb_build_object('id','adjuntos','title','Adjuntos','fields', jsonb_build_array(
        jsonb_build_object('id','autorizacion','label','Autorización firmada','type','file','required',true),
        jsonb_build_object('id','constancia_bancaria','label','Constancia de datos bancarios','type','file','required',true),
        jsonb_build_object('id','informe_actividad','label','Informe de actividad','type','file','visible_when','tiene_viaticos=true')
      ))
    )
  ),
  jsonb_build_object('fields', jsonb_build_array(
    jsonb_build_object('id','journal_id','label','Diario origen','type','select_odoo','filter','journal_type=bank','required',true),
    jsonb_build_object('id','destination_account_id','label','Cuenta destino (anticipos a rendir)','type','select_odoo','required',true),
    jsonb_build_object('id','payment_method','label','Método de pago','type','select_odoo')
  )),
  jsonb_build_object('model','account.payment','extra_fields', jsonb_build_object('payment_type','outbound','partner_type','supplier'))
),
(
  'reintegro',
  'Reintegro',
  'Reintegro de gastos ya realizados por el beneficiario',
  'Receipt',
  4,
  jsonb_build_object('version', 1, 'sections', jsonb_build_array(
    jsonb_build_object('id','contexto','title','Contexto','fields', jsonb_build_array(
      jsonb_build_object('id','codigo_proyecto','label','Código de Proyecto','type','select_analytic','required',true),
      jsonb_build_object('id','fuente_financiamiento','label','Fuente de Financiamiento','type','autofill'),
      jsonb_build_object('id','descripcion_actividad','label','Descripción de la actividad','type','textarea','required',true)
    )),
    jsonb_build_object('id','beneficiario','title','Beneficiario','fields', jsonb_build_array(
      jsonb_build_object('id','cuit_cuil','label','CUIT/CUIL','type','text','required',true),
      jsonb_build_object('id','nombre','label','Nombre','type','text','required',true),
      jsonb_build_object('id','email','label','E-mail','type','email','required',true),
      jsonb_build_object('id','cbu','label','CBU','type','text','required',true),
      jsonb_build_object('id','es_extranjero','label','Extranjero','type','toggle','default',false)
    )),
    jsonb_build_object('id','gastos','title','Gastos a reintegrar','fields', jsonb_build_array(
      jsonb_build_object('id','lineas','type','table','min_rows',1,'columns', jsonb_build_array(
        jsonb_build_object('id','concepto','label','Concepto del comprobante','type','text','required',true),
        jsonb_build_object('id','partida','label','Partida','type','select','required',true),
        jsonb_build_object('id','actividad','label','Actividad','type','text'),
        jsonb_build_object('id','importe_pesos','label','Importe Pesos','type','currency','default',0),
        jsonb_build_object('id','importe_usd','label','Importe USD/EUR','type','currency','default',0),
        jsonb_build_object('id','nro_comprobante','label','N° comprobante','type','text','required',true),
        jsonb_build_object('id','fecha_comprobante','label','Fecha','type','date','required',true),
        jsonb_build_object('id','comprobante_pdf','label','Comprobante','type','file','required',true)
      ))
    )),
    jsonb_build_object('id','adjuntos','title','Adjuntos','fields', jsonb_build_array(
      jsonb_build_object('id','autorizacion','label','Autorización firmada','type','file','required',true),
      jsonb_build_object('id','constancia_bancaria','label','Constancia de datos bancarios','type','file','required',true)
    ))
  )),
  jsonb_build_object('fields', jsonb_build_array(
    jsonb_build_object('id','journal_id','type','select_odoo','filter','journal_type=bank','required',true)
  )),
  jsonb_build_object('model','account.payment','extra_fields', jsonb_build_object('payment_type','outbound','partner_type','supplier'))
),
(
  'contrato',
  'Contrato',
  'Carga de contrato de servicios y plan de pagos asociado',
  'FileSignature',
  5,
  jsonb_build_object('version', 1, 'sections', jsonb_build_array(
    jsonb_build_object('id','contratado','title','Datos del contratado','fields', jsonb_build_array(
      jsonb_build_object('id','tipo_contrato','label','Tipo de contrato','type','select','required',true,'options', array['servicios_profesionales','locacion_servicios','honorarios','otro']),
      jsonb_build_object('id','cuit_dni','label','CUIT/DNI','type','text','required',true),
      jsonb_build_object('id','nombre_completo','label','Nombre completo','type','text','required',true),
      jsonb_build_object('id','email','label','E-mail','type','email','required',true),
      jsonb_build_object('id','cbu','label','CBU','type','text','required',true),
      jsonb_build_object('id','domicilio','label','Domicilio','type','text')
    )),
    jsonb_build_object('id','contrato','title','Detalles del contrato','fields', jsonb_build_array(
      jsonb_build_object('id','objeto','label','Objeto del contrato','type','textarea','required',true),
      jsonb_build_object('id','fecha_inicio','label','Fecha inicio','type','date','required',true),
      jsonb_build_object('id','fecha_fin','label','Fecha fin','type','date','required',true),
      jsonb_build_object('id','honorarios_totales','label','Honorarios totales','type','currency','required',true),
      jsonb_build_object('id','moneda','label','Moneda','type','select','default','ARS'),
      jsonb_build_object('id','cant_cuotas','label','Cantidad de cuotas','type','number','required',true),
      jsonb_build_object('id','frecuencia','label','Frecuencia','type','select','options',array['mensual','quincenal','unico','a_definir']),
      jsonb_build_object('id','codigo_proyecto','label','Código de Proyecto','type','select_analytic','required',true)
    )),
    jsonb_build_object('id','adjuntos','title','Adjuntos','fields', jsonb_build_array(
      jsonb_build_object('id','contrato_firmado','label','Contrato firmado','type','file','required',true),
      jsonb_build_object('id','cert_afip','label','Certificado AFIP del contratado','type','file'),
      jsonb_build_object('id','constancia_cbu','label','Constancia de CBU','type','file')
    ))
  )),
  jsonb_build_object('fields', jsonb_build_array(
    jsonb_build_object('id','cuenta_contable','type','select_odoo','required',true),
    jsonb_build_object('id','generar_plan_pagos','label','Generar plan de pagos','type','action','description','POST-DEMO: por ahora se cargan las cuotas manualmente como Pago de Factura')
  )),
  jsonb_build_object('model','custom','note','En la demo se modela como referencia. Cada cuota se carga como pago_factura.')
);

-- =============================================================================
-- LISTO — 5 tipos seedeados (sin "otro" que se agrega después)
-- =============================================================================
