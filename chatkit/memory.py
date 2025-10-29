"""Memory Tool implementation for ChatKit"""

from typing import Any, Dict
from pathlib import Path
import json
from datetime import datetime

from anthropic.lib.tools import BetaAbstractMemoryTool
from anthropic.types.beta import (
    BetaMemoryTool20250818CreateCommand,
    BetaMemoryTool20250818DeleteCommand,
    BetaMemoryTool20250818InsertCommand,
    BetaMemoryTool20250818RenameCommand,
    BetaMemoryTool20250818StrReplaceCommand,
    BetaMemoryTool20250818ViewCommand,
)


class ChatKitMemoryTool(BetaAbstractMemoryTool):
    """Memory tool implementation for ChatKit using local file storage"""

    def __init__(self, storage_dir: str = "memory"):
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(exist_ok=True)
        self.memory_file = self.storage_dir / "chat_memory.json"
        self._ensure_memory_file()

    def _ensure_memory_file(self):
        """Ensure memory file exists with basic structure"""
        if not self.memory_file.exists():
            initial_memory = {
                "user_preferences": {},
                "conversation_history": [],
                "user_facts": {},
                "notes": [],
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            self._save_memory(initial_memory)

    def _load_memory(self) -> Dict[str, Any]:
        """Load memory from storage"""
        try:
            with open(self.memory_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            # Reset memory if corrupted - return default structure instead of recursing
            self._ensure_memory_file()
            return {
                "user_facts": {},
                "notes": [],
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }

    def _save_memory(self, memory: Dict[str, Any]):
        """Save memory to storage"""
        memory["updated_at"] = datetime.now().isoformat()
        with open(self.memory_file, 'w', encoding='utf-8') as f:
            json.dump(memory, f, indent=2, ensure_ascii=False)

    def view(self, command: BetaMemoryTool20250818ViewCommand = None) -> str:
        """View memory content"""
        memory = self._load_memory()

        # If specific path is provided, navigate to that part of memory
        if command and command.path:
            parts = command.path.strip('/').split('/')
            current = memory
            for part in parts:
                if part and part in current:
                    current = current[part]
                else:
                    return f"Path '{command.path}' not found in memory"

            if isinstance(current, dict):
                return json.dumps(current, indent=2, ensure_ascii=False)
            elif isinstance(current, list):
                return '\n'.join([str(item) for item in current])
            else:
                return str(current)

        # Return summary of memory
        summary = []
        if memory.get("user_preferences"):
            summary.append(f"User preferences: {len(memory['user_preferences'])} items")
        if memory.get("user_facts"):
            summary.append(f"User facts: {len(memory['user_facts'])} items")
        if memory.get("notes"):
            summary.append(f"Notes: {len(memory['notes'])} items")
        if memory.get("conversation_history"):
            summary.append(f"Conversation history: {len(memory['conversation_history'])} entries")

        if not summary:
            return "Memory is currently empty"

        return "Memory summary:\n" + "\n".join(summary)

    def create(self, command: BetaMemoryTool20250818CreateCommand) -> str:
        """Create new memory entry"""
        memory = self._load_memory()

        if command.path:
            parts = command.path.strip('/').split('/')
            current = memory

            # Navigate to parent directory
            for part in parts[:-1]:
                if part and part not in current:
                    current[part] = {}
                current = current[part]

            # Create the new entry
            final_part = parts[-1]
            if final_part:
                current[final_part] = {}
                self._save_memory(memory)
                return f"Created memory entry at {command.path}"

        return f"Failed to create memory entry at {command.path}"

    def str_replace(self, command: BetaMemoryTool20250818StrReplaceCommand) -> str:
        """Replace string in memory"""
        memory = self._load_memory()

        if command.path:
            parts = command.path.strip('/').split('/')
            current = memory

            # Navigate to the target
            for part in parts:
                if part and part in current:
                    current = current[part]
                else:
                    return f"Path '{command.path}' not found"

            # Replace content
            if isinstance(current, str):
                old_content = current
                current = command.new_content
                self._save_memory(memory)
                return f"Replaced content at {command.path}: '{old_content}' -> '{command.new_content}'"
            else:
                return f"Cannot replace content at {command.path} - not a string"

        return "No path specified for string replacement"

    def insert(self, command: BetaMemoryTool20250818InsertCommand) -> str:
        """Insert content into memory"""
        memory = self._load_memory()

        if command.path:
            parts = command.path.strip('/').split('/')
            current = memory

            # Navigate to parent
            for part in parts[:-1]:
                if part and part not in current:
                    current[part] = {}
                current = current[part]

            # Insert content
            final_part = parts[-1]
            if final_part:
                if final_part not in current:
                    current[final_part] = []

                if isinstance(current[final_part], list):
                    insert_line = command.insert_line or len(current[final_part])
                    current[final_part].insert(insert_line, command.content)
                    self._save_memory(memory)
                    return f"Inserted content at line {insert_line} in {command.path}"
                else:
                    return f"Cannot insert into {command.path} - not a list"

        return f"Failed to insert content at {command.path}"

    def delete(self, command: BetaMemoryTool20250818DeleteCommand) -> str:
        """Delete memory entry"""
        memory = self._load_memory()

        if command.path:
            parts = command.path.strip('/').split('/')
            current = memory

            # Navigate to parent
            for part in parts[:-1]:
                if part and part in current:
                    current = current[part]
                else:
                    return f"Path '{command.path}' not found"

            # Delete the entry
            final_part = parts[-1]
            if final_part and final_part in current:
                del current[final_part]
                self._save_memory(memory)
                return f"Deleted memory entry: {command.path}"

        return f"Failed to delete {command.path}"

    def rename(self, command: BetaMemoryTool20250818RenameCommand) -> str:
        """Rename memory entry"""
        memory = self._load_memory()

        if command.old_path and command.new_path:
            old_parts = command.old_path.strip('/').split('/')
            new_parts = command.new_path.strip('/').split('/')

            # Navigate to parent of old path
            current = memory
            for part in old_parts[:-1]:
                if part and part in current:
                    current = current[part]
                else:
                    return f"Old path '{command.old_path}' not found"

            # Move the entry
            final_old = old_parts[-1]
            final_new = new_parts[-1]

            if final_old in current:
                # Navigate to parent of new path
                new_current = memory
                for part in new_parts[:-1]:
                    if part and part not in new_current:
                        new_current[part] = {}
                    new_current = new_current[part]

                # Perform the rename/move
                new_current[final_new] = current[final_old]
                del current[final_old]
                self._save_memory(memory)
                return f"Renamed {command.old_path} to {command.new_path}"

        return f"Failed to rename {command.old_path} to {command.new_path}"

    def clear_all_memory(self) -> str:
        """Clear all memory"""
        initial_memory = {
            "user_preferences": {},
            "conversation_history": [],
            "user_facts": {},
            "notes": [],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        self._save_memory(initial_memory)
        return "All memory cleared"

    def add_user_fact(self, fact_key: str, fact_value: str) -> str:
        """Add a user fact to memory"""
        memory = self._load_memory()
        memory["user_facts"][fact_key] = fact_value
        self._save_memory(memory)
        return f"Added user fact: {fact_key} = {fact_value}"

    def add_conversation_entry(self, user_message: str, assistant_response: str) -> str:
        """Add conversation to history"""
        memory = self._load_memory()
        entry = {
            "timestamp": datetime.now().isoformat(),
            "user": user_message,
            "assistant": assistant_response
        }
        memory["conversation_history"].append(entry)
        # Keep only last 100 conversations
        memory["conversation_history"] = memory["conversation_history"][-100:]
        self._save_memory(memory)
        return "Conversation added to history"

    def add_note(self, title: str, content: str) -> str:
        """Add a note to memory"""
        memory = self._load_memory()
        note = {
            "title": title,
            "content": content,
            "created_at": datetime.now().isoformat()
        }
        memory["notes"].append(note)
        self._save_memory(memory)
        return f"Note '{title}' added to memory"


# Global memory instance
chatkit_memory = ChatKitMemoryTool()