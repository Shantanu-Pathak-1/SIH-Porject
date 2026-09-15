import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import Dict, Any


def generate_ndma_cap_xml(alert_data: Dict[str, Any]) -> str:
    """
    Generates OASIS Common Alerting Protocol (CAP 1.2) XML document
    compliant with National Disaster Management Authority (NDMA) Sachet Portal specifications.
    """
    alert_id = f"IN-NDMA-GEOALERT-{alert_data.get('id', 1):06d}"
    sent_time = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S+00:00")

    risk_level = alert_data.get("risk_level", "HIGH")
    severity = "Extreme" if risk_level == "CRITICAL" else ("Severe" if risk_level == "HIGH" else "Moderate")
    urgency = "Immediate" if risk_level == "CRITICAL" else "Expected"
    certainty = "Observed" if risk_level == "CRITICAL" else "Likely"

    station_name = alert_data.get("station_name", "North Eastern Region Monitoring Station")
    lat = alert_data.get("latitude", 25.5686)
    lon = alert_data.get("longitude", 91.8833)

    # Build XML Root
    root = ET.Element("alert", xmlns="urn:oasis:names:tc:emergency:cap:1.2")

    ET.SubElement(root, "identifier").text = alert_id
    ET.SubElement(root, "sender").text = "geoalert-ner.controlroom@ndma.gov.in"
    ET.SubElement(root, "sent").text = sent_time
    ET.SubElement(root, "status").text = "Actual"
    ET.SubElement(root, "msgType").text = "Alert"
    ET.SubElement(root, "scope").text = "Public"
    ET.SubElement(root, "code").text = "NDMA_SACHET_V1"

    # Info Block
    info = ET.SubElement(root, "info")
    ET.SubElement(info, "language").text = "en-IN"
    ET.SubElement(info, "category").text = "Geo"
    ET.SubElement(info, "event").text = "Landslide Warning"
    ET.SubElement(info, "responseType").text = "Evacuate" if risk_level == "CRITICAL" else "Prepare"
    ET.SubElement(info, "urgency").text = urgency
    ET.SubElement(info, "severity").text = severity
    ET.SubElement(info, "certainty").text = certainty
    ET.SubElement(info, "eventCode").text = "GEO_LANDSLIDE"

    headline = f"LANDSLIDE ALERT: {risk_level} Risk Level at {station_name}"
    ET.SubElement(info, "headline").text = headline
    ET.SubElement(info, "description").text = alert_data.get("message", f"Heavy saturation and slope tilt detected near {station_name}.")
    ET.SubElement(info, "instruction").text = (
        "Immediate Action Required: Move to designated safe shelter. "
        "Avoid steep hill cut roads and river bank corridors. Contact Helpline 1077 for emergency assistance."
    )
    ET.SubElement(info, "web").text = "https://sachet.ndma.gov.in"
    ET.SubElement(info, "contact").text = "NER State Disaster Management Authority Helpline: 1077"

    # Area Block
    area = ET.SubElement(info, "area")
    ET.SubElement(area, "areaDesc").text = f"{station_name} 5km Buffer Zone"
    ET.SubElement(area, "circle").text = f"{lat:.4f},{lon:.4f},5.0"

    # Convert to XML string with standard declaration
    xml_str = ET.tostring(root, encoding="utf-8", method="xml").decode("utf-8")
    declaration = '<?xml version="1.0" encoding="UTF-8"?>\n'
    return declaration + xml_str
