# import re
# from rapidfuzz import fuzz

# def normalize_name(name):
#     """
#     Normalize company names by:
#     - Removing common suffixes (Ltd, Inc, LLC, etc.)
#     - Removing extra spaces and punctuation
#     - Converting to uppercase for uniformity
#     """
#     if not name:
#         return set()
    
#     # Split if multiple assignees exist (separated by "|")
#     names = re.split(r'\s*\|\s*', name)
    
#     # Common suffixes to remove
#     suffixes = {"LTD", "INC", "LLC", "CORP", "HOLDINGS", "PTE", "INTERNATIONAL", "TECH", "TECHNOLOGY", "TECHNOLOGIES"}

#     normalized_set = set()
#     for name in names:
#         # Remove punctuation and extra spaces
#         name = re.sub(r'[^\w\s]', '', name).strip().upper()
#         # Remove common suffixes
#         name_parts = name.split()
#         name_parts = [part for part in name_parts if part not in suffixes]
#         cleaned_name = " ".join(name_parts)
#         normalized_set.add(cleaned_name)

#     return normalized_set

# def are_names_similar(original, current, threshold=80):
#     """
#     Check if two sets of names are similar using set intersection + fuzzy matching.
#     - If there's an exact match in the set, return True.
#     - If not, use fuzzy matching with a threshold (default 85% similarity).
#     """
#     if original.intersection(current):
#         return True  # Exact match found
    
#     for orig_name in original:
#         for curr_name in current:
#             if fuzz.ratio(orig_name, curr_name) >= threshold:
#                 return True  # Fuzzy match found

#     return False  # Names are different
