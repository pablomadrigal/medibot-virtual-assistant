#!/usr/bin/env python3
"""
Test script for the medical consultation agent
This script verifies that the agent can be imported and configured correctly
"""

import os
import sys
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_agent_import():
    """Test that the agent can be imported correctly"""
    try:
        from medical_agent import MedicalConsultationAgent, entrypoint
        logger.info("✅ Agent imports successfully")
        return True
    except ImportError as e:
        logger.error(f"❌ Failed to import agent: {e}")
        return False

def test_environment_variables():
    """Test that all required environment variables are set"""
    required_vars = [
        "LIVEKIT_URL", 
        "LIVEKIT_API_KEY", 
        "LIVEKIT_API_SECRET", 
        "OPENAI_API_KEY",
        "DEEPGRAM_API_KEY",
        "CARTESIA_API_KEY"
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        logger.error(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        return False
    else:
        logger.info("✅ All environment variables are set")
        return True

def test_agent_initialization():
    """Test that the agent can be initialized"""
    try:
        from medical_agent import MedicalConsultationAgent
        agent = MedicalConsultationAgent()
        logger.info("✅ Agent initialized successfully")
        logger.info(f"   Consultation step: {agent.consultation_step}")
        logger.info(f"   Patient data: {agent.patient_data}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to initialize agent: {e}")
        return False

def test_livekit_agents_import():
    """Test that LiveKit agents can be imported"""
    try:
        from livekit import agents
        from livekit.plugins import openai, cartesia, deepgram, silero
        logger.info("✅ LiveKit agents and plugins imported successfully")
        return True
    except ImportError as e:
        logger.error(f"❌ Failed to import LiveKit agents: {e}")
        return False

def main():
    """Run all tests"""
    logger.info("🧪 Starting agent tests...")
    
    tests = [
        ("LiveKit Agents Import", test_livekit_agents_import),
        ("Agent Import", test_agent_import),
        ("Environment Variables", test_environment_variables),
        ("Agent Initialization", test_agent_initialization),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        logger.info(f"\n--- Testing: {test_name} ---")
        if test_func():
            passed += 1
        else:
            logger.error(f"❌ Test failed: {test_name}")
    
    logger.info(f"\n📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        logger.info("🎉 All tests passed! Agent is ready for deployment.")
        return 0
    else:
        logger.error("❌ Some tests failed. Please fix the issues before deployment.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
