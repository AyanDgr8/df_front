// src/components/routes/Forms/ListForm/ListForm.js

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ListForm.css";

const ListForm = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 
  const [currentPage, setCurrentPage] = useState(1);
  const [customersPerPage] = useState(12);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);
  const [selectedTeamUser, setSelectedTeamUser] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.REACT_APP_API_URL;
  
        // Fetch user data
        const userResponse = await axios.get(`${apiUrl}/current-user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(userResponse.data);
        
        // Check if user is admin
        const userRole = userResponse.data.role;
        const isAdminUser = userRole === 'Super_Admin' || userRole === 'Department_Admin';
        setIsAdmin(isAdminUser);
        
        // If user is MIS, redirect to upload page
        if (userRole === 'MIS') {
          navigate('/upload-customer-data');
          return;
        }
  
        // Fetch customers
        if (userResponse.data && userRole !== 'MIS') {
          const response = await axios.get(`${apiUrl}/customers`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.data.records && Array.isArray(response.data.records)) {
            setCustomers(response.data.records);
          } else {
            console.error('Invalid customers data format:', response.data);
            setError('Invalid data format received from server');
          }

          // Fetch team users if admin
          if (isAdminUser) {
            const teamResponse = await axios.get(`${apiUrl}/users`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            // Filter out non-team users (like admins)
            const teamUsers = teamResponse.data.filter(user => 
              user.role !== 'Super_Admin' && 
              user.role !== 'Department_Admin' && 
              user.role !== 'MIS'
            );
            setTeamUsers(teamUsers);
          }
        }
      } catch (error) {
        setError('Failed to fetch data.');
        console.error('Error fetching data:', error.response || error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Function to format the last updated timestamp
  const formatDateTime = (dateString) => {
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };
    return new Date(dateString).toLocaleString('en-GB', options);
  };

  // Get the current customers to display based on the page
  const indexOfLastCustomer = currentPage * customersPerPage;
  const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage;
  const currentCustomers = customers.slice(indexOfFirstCustomer, indexOfLastCustomer);

  const handleSelectCustomer = (customer) => {
    setSelectedCustomers(prev => {
      const isSelected = prev.find(c => c.id === customer.id);
      if (isSelected) {
        return prev.filter(c => c.id !== customer.id);
      } else {
        return [...prev, customer];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === currentCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(currentCustomers);
    }
  };

  const handleAssignTeam = async () => {
    if (!selectedTeamUser || selectedCustomers.length === 0) {
      alert('Please select team user and customers to assign');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL;
      
      // Log the selected customers and team user
      console.log('Selected Team User:', selectedTeamUser);
      console.log('Selected Customers:', selectedCustomers);
      
      // Assign each customer to the selected team user
      const assignPromises = selectedCustomers.map(customer => {
        const requestData = {
          customer_id: customer.C_unique_id,
          user_id: selectedTeamUser
        };
        console.log('Sending request data:', requestData);
        
        return axios.post(
          `${apiUrl}/assign-customer`, 
          requestData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      });

      await Promise.all(assignPromises);

      // Refresh the customer list
      const response = await axios.get(`${apiUrl}/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.records && Array.isArray(response.data.records)) {
        setCustomers(response.data.records);
        setSelectedCustomers([]);
        setSelectedTeamUser('');
        alert('Customers assigned successfully!');
      }
    } catch (error) {
      console.error('Error assigning customers:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.message || 'Failed to assign customers. Please try again.';
      alert(errorMsg);
    }
  };

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Generate page numbers for pagination
  const renderPageNumbers = () => {
    const totalPages = Math.ceil(customers.length / customersPerPage);
    const maxPagesToShow = 5;
    let pages = [];

    if (totalPages <= maxPagesToShow) {
      // If total pages are less than max pages to show, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        // Show the first few pages and "..." for the rest
        pages = [1, 2, 3, 4, "...", totalPages];
      } else if (currentPage >= totalPages - 2) {
        // Show "..." and the last few pages
        pages = [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
      } else {
        // Show "..." before and after the current page
        pages = [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
      }
    }

    return pages.map((page, index) =>
      page === "..." ? (
        <span key={index} className="dots">
          ...
        </span>
      ) : (
        <button
          key={page}
          onClick={() => paginate(page)}
          className={`page-number ${currentPage === page ? "active" : ""}`}
          aria-label={`Go to page ${page}`}
        >
          {page}
        </button>
      )
    );
  };

  const handleEdit = (customer) => {
    navigate('/customers/phone/' + customer.phone_no, { state: { customer } });
  };

  const handleAddRecord = () => {
    navigate("/customer/new"); 
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div>
      {/* <Popup /> */}
      <h2 className="list_form_headi">Customer Relationship Management</h2>
      <div className="list-container">
        <div className="table-container">
          {currentCustomers.length > 0 ? (
            <table className="customers-table">
              <thead>
                <tr className="customer-row">
                  {isAdmin && (
                    <th>
                      <input
                        type="checkbox"
                        checked={selectedCustomers.length === currentCustomers.length}
                        onChange={handleSelectAll}
                      />
                    </th>
                  )}
                  <th>ID</th>
                  <th>Customer Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Disposition</th>
                  <th>Gender</th>
                  <th>Region</th>
                  <th>Agent Assigned</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody className="customer-body">
                {currentCustomers.map((customer) => (
                  <tr 
                    key={customer.id} 
                    onClick={(e) => {
                      if (e.target.type !== 'checkbox') {
                        handleEdit(customer);
                      }
                    }} 
                    style={{ cursor: 'pointer' }}
                  >
                    {isAdmin && (
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedCustomers.some(c => c.id === customer.id)}
                          onChange={() => handleSelectCustomer(customer)}
                        />
                      </td>
                    )}
                    <td>{customer.C_unique_id}</td>
                    <td className="customer-name">{customer.first_name} {customer.last_name}</td>
                    <td>{customer.email_id}</td>
                    <td><a href={`tel:${customer.phone_no}`}>{customer.phone_no}</a></td>
                    <td>{customer.disposition}</td>
                    <td>{customer.gender}</td>
                    <td>{customer.region}</td>
                    <td>{customer.agent_name}</td>
                    <td>{formatDateTime(customer.last_updated)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No recent records found.</p>
          )}
        </div>

        {/* Team assignment controls for admin */}
        {isAdmin && selectedCustomers.length > 0 && (
          <div className="team-assignment-controls">
            <select 
              value={selectedTeamUser}
              onChange={(e) => setSelectedTeamUser(e.target.value)}
              className="team-user-select"
            >
              <option value="">Select User</option>
              {teamUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
            </select>
            <button 
              onClick={handleAssignTeam}
              className="assign-team-btn"
              disabled={!selectedTeamUser}
            >
              Assign to Team User
            </button>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="pagination-container">
          {/* <button 
            onClick={handleAddRecord} 
            className="add-record-btn"
            aria-label="Add new customer"
          >
            Add Record 
          </button> */}

          <div className="pagination">
            {currentPage > 1 && (
              <button
                onClick={() => paginate(currentPage - 1)}
                className="page-number"
                aria-label="Previous page"
              >
                Previous
              </button>
            )}

            {[...Array(Math.ceil(customers.length / customersPerPage)).keys()].map((_, idx) => idx + 1)
              .filter((pageNumber) => {
                const totalPages = Math.ceil(customers.length / customersPerPage);
                // Show first two pages, current page, last two pages, and pages around the current
                return (
                  pageNumber === 1 || // Always show the first page
                  pageNumber === totalPages || // Always show the last page
                  pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1 // Show current page and adjacent pages
                );
              })
              .map((pageNumber, index, array) => {
                // Add "..." where needed
                const isGap = array[index + 1] !== pageNumber + 1 && pageNumber !== Math.ceil(customers.length / customersPerPage);
                return (
                  <React.Fragment key={pageNumber}>
                    <button
                      onClick={() => paginate(pageNumber)}
                      className={`page-number ${currentPage === pageNumber ? 'active' : ''}`}
                      aria-label={`Go to page ${pageNumber}`}
                    >
                      {pageNumber}
                    </button>
                    {isGap && <span className="ellipsis">...</span>}
                  </React.Fragment>
                );
              })}

            {currentPage < Math.ceil(customers.length / customersPerPage) && (
              <button
                onClick={() => paginate(currentPage + 1)}
                className="page-number"
                aria-label="Next page"
              >
                Next
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ListForm;


